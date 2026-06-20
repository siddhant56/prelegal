import json
import os
import secrets
import sqlite3
from contextlib import asynccontextmanager
from dataclasses import dataclass
from datetime import date, datetime, timezone, timedelta
from pathlib import Path
import logging
from typing import Literal, Optional

logger = logging.getLogger(__name__)

from fastapi import Cookie, Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, Response
import bcrypt as _bcrypt
from jose import JWTError, jwt
from litellm import completion
from pydantic import BaseModel, create_model

STATIC_DIR = Path(__file__).parent / "static"
DB_PATH = Path(__file__).parent / "prelegal.db"

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}

# JWT — falls back to a random secret (invalidated on restart) if not configured
SECRET_KEY = os.environ.get("JWT_SECRET_KEY") or secrets.token_hex(32)
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7


# ============================================================
# FIELD MODELS
# ============================================================

class NDAFields(BaseModel):
    purpose: Optional[str] = None
    effectiveDate: Optional[str] = None
    mndaTermType: Optional[str] = None
    mndaTermYears: Optional[str] = None
    confidentialityTermType: Optional[str] = None
    confidentialityTermYears: Optional[str] = None
    governingLaw: Optional[str] = None
    jurisdiction: Optional[str] = None
    modifications: Optional[str] = None
    party1Name: Optional[str] = None
    party1Title: Optional[str] = None
    party1Company: Optional[str] = None
    party1Address: Optional[str] = None
    party2Name: Optional[str] = None
    party2Title: Optional[str] = None
    party2Company: Optional[str] = None
    party2Address: Optional[str] = None


class DesignPartnerFields(BaseModel):
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    partnerName: Optional[str] = None
    partnerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    term: Optional[str] = None
    productDescription: Optional[str] = None
    programDescription: Optional[str] = None
    fees: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None


class PilotFields(BaseModel):
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    customerName: Optional[str] = None
    customerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    pilotPeriod: Optional[str] = None
    productDescription: Optional[str] = None
    generalCapAmount: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None
    noticeAddress: Optional[str] = None


class AIAddendumFields(BaseModel):
    customerName: Optional[str] = None
    customerAddress: Optional[str] = None
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    agreementName: Optional[str] = None
    allowTraining: Optional[str] = None
    trainingData: Optional[str] = None
    trainingPurposes: Optional[str] = None
    trainingRestrictions: Optional[str] = None
    improvementRestrictions: Optional[str] = None


class BAAFields(BaseModel):
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    companyName: Optional[str] = None
    companyAddress: Optional[str] = None
    agreementName: Optional[str] = None
    baaEffectiveDate: Optional[str] = None
    breachNotificationPeriod: Optional[str] = None
    limitations: Optional[str] = None


class CSAFields(BaseModel):
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    customerName: Optional[str] = None
    customerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    productDescription: Optional[str] = None
    subscriptionPeriod: Optional[str] = None
    fees: Optional[str] = None
    paymentProcess: Optional[str] = None
    generalCapAmount: Optional[str] = None
    technicalSupport: Optional[str] = None
    dpa: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None


class DPAFields(BaseModel):
    customerName: Optional[str] = None
    customerAddress: Optional[str] = None
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    agreementName: Optional[str] = None
    categoriesOfPersonalData: Optional[str] = None
    categoriesOfDataSubjects: Optional[str] = None
    governingMemberState: Optional[str] = None
    approvedSubprocessors: Optional[str] = None


class SoftwareLicenseFields(BaseModel):
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    customerName: Optional[str] = None
    customerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    productDescription: Optional[str] = None
    subscriptionPeriod: Optional[str] = None
    permittedUses: Optional[str] = None
    licenseLimits: Optional[str] = None
    fees: Optional[str] = None
    paymentProcess: Optional[str] = None
    warrantyPeriod: Optional[str] = None
    deletionProcedure: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None


class PartnershipFields(BaseModel):
    companyName: Optional[str] = None
    companyAddress: Optional[str] = None
    partnerName: Optional[str] = None
    partnerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    endDate: Optional[str] = None
    obligations: Optional[str] = None
    paymentProcess: Optional[str] = None
    paymentSchedule: Optional[str] = None
    territory: Optional[str] = None
    brandGuidelines: Optional[str] = None
    generalCapAmount: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None


class PSAFields(BaseModel):
    providerName: Optional[str] = None
    providerAddress: Optional[str] = None
    customerName: Optional[str] = None
    customerAddress: Optional[str] = None
    effectiveDate: Optional[str] = None
    securityPolicy: Optional[str] = None
    customerPolicies: Optional[str] = None
    dpa: Optional[str] = None
    governingLaw: Optional[str] = None
    chosenCourts: Optional[str] = None
    generalCapAmount: Optional[str] = None


class SLAFields(BaseModel):
    providerName: Optional[str] = None
    customerName: Optional[str] = None
    targetUptime: Optional[str] = None
    targetResponseTime: Optional[str] = None
    supportChannel: Optional[str] = None
    uptimeCredit: Optional[str] = None
    responseTimeCredit: Optional[str] = None
    scheduledDowntime: Optional[str] = None


# ============================================================
# SHARED FOLLOW-UP INSTRUCTION (appended to every system prompt)
# ============================================================

_FOLLOWUP_INSTRUCTION = """
After each user turn:
1. Extract any field values the user provided and update the fields object
2. Identify which required fields are still null
3. Ask specifically about the next 1-2 missing fields — be direct and mention them by name
4. Never set is_complete to true until every required field has been explicitly confirmed by the user
5. If you inferred a value from context rather than the user stating it explicitly, ask to confirm it before setting is_complete"""


# ============================================================
# SYSTEM PROMPTS
# ============================================================

NDA_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Mutual Non-Disclosure Agreement (MNDA).

Today's date is {today}.

Have a friendly, efficient conversation to collect all required information.

Required fields:
- purpose: Why parties are sharing confidential information
- effectiveDate: NDA start date in YYYY-MM-DD format (use today's date if user says "today")
- mndaTermType: "expires" for a fixed period, or "until_terminated"
- mndaTermYears: Number of years as a string (only required when mndaTermType is "expires")
- confidentialityTermType: "years" or "perpetuity"
- confidentialityTermYears: Number of years as a string (only required when confidentialityTermType is "years")
- governingLaw: Governing state name (e.g. "Delaware")
- jurisdiction: Where disputes are resolved (e.g. "New Castle, Delaware")
- party1Name, party1Title, party1Company, party1Address: First party details
- party2Name, party2Title, party2Company, party2Address: Second party details
- modifications: Any changes to standard terms (use empty string "" if none)

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated (including mndaTermYears when mndaTermType is "expires", and confidentialityTermYears when confidentialityTermType is "years"). When complete, confirm everything is captured and tell the user to click Preview NDA.
""" + _FOLLOWUP_INSTRUCTION

NDA_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Mutual NDA form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is (respect what the user entered)
2. Infer and suggest values for empty fields where you can reasonably do so (e.g. if a party address suggests a state, you might infer governingLaw and jurisdiction)
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: purpose, effectiveDate, mndaTermType, confidentialityTermType, governingLaw, jurisdiction, party1Name, party1Title, party1Company, party1Address, party2Name, party2Title, party2Company, party2Address, modifications (use empty string if none)
Conditionally required: mndaTermYears (when mndaTermType is "expires"), confidentialityTermYears (when confidentialityTermType is "years")

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

DESIGN_PARTNER_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Design Partner Agreement.

Today's date is {today}.

This agreement is between a Provider (sharing their product for early access) and a Partner (providing feedback). Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Provider's company name
- providerAddress: Provider's notice address (email or postal)
- partnerName: Partner's company name
- partnerAddress: Partner's notice address (email or postal)
- effectiveDate: Agreement start date in YYYY-MM-DD format
- term: Duration of the agreement (e.g. "6 months", "12 months")
- productDescription: Description of the Provider's product being shared
- programDescription: Description of the design partner program and what Partner will do
- fees: Fees Partner will pay, if any (use "None" if no fees)
- governingLaw: Governing state/jurisdiction (e.g. "California")
- chosenCourts: Courts for disputes (e.g. "courts located in San Francisco, California")

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

DESIGN_PARTNER_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Design Partner Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, providerAddress, partnerName, partnerAddress, effectiveDate, term, productDescription, programDescription, fees, governingLaw, chosenCourts

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

PILOT_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Pilot Agreement.

Today's date is {today}.

This is a time-limited trial agreement for a customer to test a provider's product. Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Provider's company name
- providerAddress: Provider's notice address (email or postal)
- customerName: Customer's company name
- customerAddress: Customer's notice address (email or postal)
- effectiveDate: Agreement start date in YYYY-MM-DD format
- pilotPeriod: Duration of the pilot (e.g. "30 days", "3 months")
- productDescription: Description of the product being piloted
- generalCapAmount: Liability cap (e.g. "$10,000", "$50,000")
- governingLaw: Governing state (e.g. "Delaware")
- chosenCourts: Courts for disputes (e.g. "courts located in Wilmington, Delaware")
- noticeAddress: Contact address for notices (email or postal)

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

PILOT_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Pilot Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, providerAddress, customerName, customerAddress, effectiveDate, pilotPeriod, productDescription, generalCapAmount, governingLaw, chosenCourts, noticeAddress

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

AI_ADDENDUM_SYSTEM_PROMPT = """You are a legal document assistant helping users create an AI Addendum to an existing agreement.

Today's date is {today}.

This addendum adds AI-specific provisions to an existing commercial agreement. Have a friendly, efficient conversation to collect all required information.

Required fields:
- customerName: Customer's company name
- customerAddress: Customer's notice address
- providerName: Provider's company name
- providerAddress: Provider's notice address
- effectiveDate: Addendum effective date in YYYY-MM-DD format
- agreementName: Name of the underlying agreement this attaches to (e.g. "Cloud Service Agreement dated January 1, 2025")
- allowTraining: Whether Provider may use customer data to train AI models — "yes" or "no"
- trainingData: Description of data allowed for training (only required when allowTraining is "yes")
- trainingPurposes: Purpose of the training (only required when allowTraining is "yes")
- trainingRestrictions: Any restrictions on training (only required when allowTraining is "yes"; use "None" if no restrictions)
- improvementRestrictions: Any restrictions on using data for product improvement (use "None" if no restrictions)

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated (trainingData, trainingPurposes, and trainingRestrictions are only required when allowTraining is "yes"). When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

AI_ADDENDUM_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out an AI Addendum form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: customerName, customerAddress, providerName, providerAddress, effectiveDate, agreementName, allowTraining, improvementRestrictions
Conditionally required (when allowTraining is "yes"): trainingData, trainingPurposes, trainingRestrictions

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

BAA_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Business Associate Agreement (BAA).

Today's date is {today}.

A BAA governs how a business associate (Provider) handles protected health information (PHI) on behalf of a covered entity (Company) under HIPAA. Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Business associate's company name (the entity providing services)
- providerAddress: Provider's notice address
- companyName: Covered entity's company name (the HIPAA-covered entity)
- companyAddress: Company's notice address
- agreementName: Name of the underlying service agreement (e.g. "Software Services Agreement dated March 1, 2025")
- baaEffectiveDate: BAA start date in YYYY-MM-DD format
- breachNotificationPeriod: Time within which Provider must notify Company of a breach (e.g. "72 hours", "30 days")
- limitations: Any restrictions on offshoring PHI, de-identification, or aggregation (use "None" if no restrictions)

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

BAA_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a BAA form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, providerAddress, companyName, companyAddress, agreementName, baaEffectiveDate, breachNotificationPeriod, limitations

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

CSA_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Cloud Service Agreement (CSA).

Today's date is {today}.

A CSA governs the provision of cloud-hosted software services. Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Provider's company name
- providerAddress: Provider's notice address
- customerName: Customer's company name
- customerAddress: Customer's notice address
- effectiveDate: Agreement effective date in YYYY-MM-DD format
- productDescription: Description of the cloud service/product
- subscriptionPeriod: Length of the subscription (e.g. "12 months", "2 years")
- fees: Subscription fees (e.g. "$500/month", "$6,000/year")
- paymentProcess: How payment is made (e.g. "Net-30 invoicing", "Auto-charge credit card monthly")
- generalCapAmount: Liability cap (e.g. "$10,000", "Fees paid in the prior 12 months")
- technicalSupport: Support included (e.g. "Email support during business hours", "24/7 phone and email support")
- dpa: Data processing agreement reference (e.g. "Exhibit A to this Agreement") or "None" if not applicable
- governingLaw: Governing state (e.g. "New York")
- chosenCourts: Courts for disputes (e.g. "courts located in New York County, New York")

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

CSA_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Cloud Service Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, providerAddress, customerName, customerAddress, effectiveDate, productDescription, subscriptionPeriod, fees, paymentProcess, generalCapAmount, technicalSupport, dpa, governingLaw, chosenCourts

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

DPA_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Data Processing Agreement (DPA).

Today's date is {today}.

A DPA governs how a service provider processes personal data on behalf of a controller under GDPR. Have a friendly, efficient conversation to collect all required information.

Required fields:
- customerName: Data controller's company name (the entity that owns the data)
- customerAddress: Customer's notice address
- providerName: Data processor's company name (the entity processing the data)
- providerAddress: Provider's notice address
- agreementName: Name of the underlying agreement this DPA is part of (e.g. "Cloud Service Agreement dated January 1, 2025")
- categoriesOfPersonalData: Types of personal data being processed (e.g. "Name, email address, IP address, usage data")
- categoriesOfDataSubjects: Who the data belongs to (e.g. "Customer employees, end users of the platform")
- governingMemberState: EU member state whose law governs (e.g. "Germany", "Ireland")
- approvedSubprocessors: List of approved subprocessors (e.g. "AWS (US), Stripe (US), SendGrid (US)") or "None"

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

DPA_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Data Processing Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: customerName, customerAddress, providerName, providerAddress, agreementName, categoriesOfPersonalData, categoriesOfDataSubjects, governingMemberState, approvedSubprocessors

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

SOFTWARE_LICENSE_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Software License Agreement.

Today's date is {today}.

This agreement covers on-premise software licensing. Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Software provider's company name
- providerAddress: Provider's notice address
- customerName: Customer's company name
- customerAddress: Customer's notice address
- effectiveDate: Agreement start date in YYYY-MM-DD format
- productDescription: Description of the software being licensed
- subscriptionPeriod: License duration (e.g. "12 months", "3 years")
- permittedUses: What the customer is licensed to use the software for (e.g. "Internal business operations")
- licenseLimits: Any limits on the license (e.g. "Up to 50 named users", "Single production deployment")
- fees: License fees (e.g. "$50,000/year")
- paymentProcess: How payment is made (e.g. "Annual invoice, Net-30")
- warrantyPeriod: Software warranty period (e.g. "90 days", "1 year")
- deletionProcedure: How customer data is deleted on termination (e.g. "Provider will delete all customer data within 30 days of termination")
- governingLaw: Governing state (e.g. "California")
- chosenCourts: Courts for disputes (e.g. "courts located in Santa Clara County, California")

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

SOFTWARE_LICENSE_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Software License Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, providerAddress, customerName, customerAddress, effectiveDate, productDescription, subscriptionPeriod, permittedUses, licenseLimits, fees, paymentProcess, warrantyPeriod, deletionProcedure, governingLaw, chosenCourts

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

PARTNERSHIP_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Partnership Agreement.

Today's date is {today}.

This is a reseller, referral, or channel partner agreement including trademark licensing. Have a friendly, efficient conversation to collect all required information.

Required fields:
- companyName: The licensor company's name (the company granting the partnership)
- companyAddress: Licensor's notice address
- partnerName: The partner's company name
- partnerAddress: Partner's notice address
- effectiveDate: Agreement start date in YYYY-MM-DD format
- endDate: Agreement end date in YYYY-MM-DD format
- obligations: Description of what each party will do under this partnership (e.g. "Partner will resell Company products to customers in the Territory; Company will provide sales support and a 20% commission")
- paymentProcess: How fees are paid (e.g. "Monthly invoices, Net-30") or "None" if no fees
- paymentSchedule: When fees are paid (e.g. "Monthly on the 1st") or "None" if no fees
- territory: Geographic scope of the partnership (e.g. "United States", "North America", "Worldwide")
- brandGuidelines: Reference to brand guidelines (e.g. "Brand Guidelines at company.com/brand") or "None"
- generalCapAmount: Liability cap (e.g. "$50,000", "Fees paid in the prior 12 months")
- governingLaw: Governing state (e.g. "Texas")
- chosenCourts: Courts for disputes (e.g. "courts located in Austin, Texas")

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

PARTNERSHIP_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Partnership Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: companyName, companyAddress, partnerName, partnerAddress, effectiveDate, endDate, obligations, paymentProcess, paymentSchedule, territory, brandGuidelines, generalCapAmount, governingLaw, chosenCourts

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

PSA_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Professional Services Agreement (PSA).

Today's date is {today}.

This agreement governs the delivery of professional and consulting services. Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Services provider's company name
- providerAddress: Provider's notice address
- customerName: Customer's company name
- customerAddress: Customer's notice address
- effectiveDate: Agreement start date in YYYY-MM-DD format
- securityPolicy: Security standards the provider will comply with (e.g. "Provider's Information Security Policy at company.com/security") or "None"
- customerPolicies: Customer policies the provider must follow (e.g. "Customer's vendor code of conduct") or "None"
- dpa: Data processing agreement reference (e.g. "Exhibit A to this Agreement") or "None"
- governingLaw: Governing state (e.g. "Washington")
- chosenCourts: Courts for disputes (e.g. "courts located in King County, Washington")
- generalCapAmount: Liability cap (e.g. "$100,000", "Fees paid in the prior 12 months")

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

PSA_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Professional Services Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Fix obvious formatting issues in existing values (dates must be YYYY-MM-DD)
4. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, providerAddress, customerName, customerAddress, effectiveDate, securityPolicy, customerPolicies, dpa, governingLaw, chosenCourts, generalCapAmount

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""

SLA_SYSTEM_PROMPT = """You are a legal document assistant helping users create a Service Level Agreement (SLA).

Today's date is {today}.

An SLA defines uptime and support response commitments for a cloud service. Have a friendly, efficient conversation to collect all required information.

Required fields:
- providerName: Cloud service provider's company name
- customerName: Customer's company name
- targetUptime: Uptime commitment as a percentage (e.g. "99.9%", "99.5%")
- targetResponseTime: Support response time commitment (e.g. "4 business hours", "1 business day")
- supportChannel: How customers submit support requests (e.g. "support@company.com", "https://support.company.com")
- uptimeCredit: Service credit when uptime falls below target (e.g. "10% of monthly Cloud Service Fees", "5% of monthly fees per 0.1% below target")
- responseTimeCredit: Service credit when response time is missed (e.g. "5% of monthly fees per missed response")
- scheduledDowntime: Planned maintenance window (e.g. "Up to 4 hours per month with 24-hour advance notice") or "None"

Extract field values from user responses and include them in the fields object. Only include fields you have confirmed values for — set all others to null.

Set is_complete to true ONLY when ALL required fields are populated. When complete, confirm everything is captured and tell the user to click Preview.
""" + _FOLLOWUP_INSTRUCTION

SLA_AUTOFILL_PROMPT = """You are a legal document assistant. The user is filling out a Service Level Agreement form and has pre-entered some fields.

Today's date is {today}.

Your tasks:
1. Keep all existing non-null values exactly as-is
2. Infer and suggest values for empty fields where you can reasonably do so
3. Set is_complete to true only when ALL required fields are populated

Required fields: providerName, customerName, targetUptime, targetResponseTime, supportChannel, uptimeCredit, responseTimeCredit, scheduledDowntime

Return a concise message explaining what you filled in, what still needs attention, or confirming everything is complete."""


# ============================================================
# DOC TYPE CONFIG REGISTRY
# ============================================================

@dataclass
class DocTypeConfig:
    name: str
    fields_model: type[BaseModel]
    system_prompt_template: str
    autofill_prompt_template: str


DOC_TYPE_CONFIGS: dict[str, DocTypeConfig] = {
    "mutual-nda": DocTypeConfig(
        name="Mutual NDA",
        fields_model=NDAFields,
        system_prompt_template=NDA_SYSTEM_PROMPT,
        autofill_prompt_template=NDA_AUTOFILL_PROMPT,
    ),
    "design-partner-agreement": DocTypeConfig(
        name="Design Partner Agreement",
        fields_model=DesignPartnerFields,
        system_prompt_template=DESIGN_PARTNER_SYSTEM_PROMPT,
        autofill_prompt_template=DESIGN_PARTNER_AUTOFILL_PROMPT,
    ),
    "pilot-agreement": DocTypeConfig(
        name="Pilot Agreement",
        fields_model=PilotFields,
        system_prompt_template=PILOT_SYSTEM_PROMPT,
        autofill_prompt_template=PILOT_AUTOFILL_PROMPT,
    ),
    "ai-addendum": DocTypeConfig(
        name="AI Addendum",
        fields_model=AIAddendumFields,
        system_prompt_template=AI_ADDENDUM_SYSTEM_PROMPT,
        autofill_prompt_template=AI_ADDENDUM_AUTOFILL_PROMPT,
    ),
    "baa": DocTypeConfig(
        name="Business Associate Agreement",
        fields_model=BAAFields,
        system_prompt_template=BAA_SYSTEM_PROMPT,
        autofill_prompt_template=BAA_AUTOFILL_PROMPT,
    ),
    "csa": DocTypeConfig(
        name="Cloud Service Agreement",
        fields_model=CSAFields,
        system_prompt_template=CSA_SYSTEM_PROMPT,
        autofill_prompt_template=CSA_AUTOFILL_PROMPT,
    ),
    "dpa": DocTypeConfig(
        name="Data Processing Agreement",
        fields_model=DPAFields,
        system_prompt_template=DPA_SYSTEM_PROMPT,
        autofill_prompt_template=DPA_AUTOFILL_PROMPT,
    ),
    "software-license-agreement": DocTypeConfig(
        name="Software License Agreement",
        fields_model=SoftwareLicenseFields,
        system_prompt_template=SOFTWARE_LICENSE_SYSTEM_PROMPT,
        autofill_prompt_template=SOFTWARE_LICENSE_AUTOFILL_PROMPT,
    ),
    "partnership-agreement": DocTypeConfig(
        name="Partnership Agreement",
        fields_model=PartnershipFields,
        system_prompt_template=PARTNERSHIP_SYSTEM_PROMPT,
        autofill_prompt_template=PARTNERSHIP_AUTOFILL_PROMPT,
    ),
    "psa": DocTypeConfig(
        name="Professional Services Agreement",
        fields_model=PSAFields,
        system_prompt_template=PSA_SYSTEM_PROMPT,
        autofill_prompt_template=PSA_AUTOFILL_PROMPT,
    ),
    "sla": DocTypeConfig(
        name="Service Level Agreement",
        fields_model=SLAFields,
        system_prompt_template=SLA_SYSTEM_PROMPT,
        autofill_prompt_template=SLA_AUTOFILL_PROMPT,
    ),
}


# ============================================================
# REQUEST / RESPONSE MODELS
# ============================================================

class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class AutofillRequest(BaseModel):
    fields: NDAFields


class ChatResponse(BaseModel):
    message: str
    fields: NDAFields
    is_complete: bool


class DocumentChatRequest(BaseModel):
    doc_type: str
    messages: list[ChatMessage]


class DocumentAutofillRequest(BaseModel):
    doc_type: str
    fields: dict[str, Optional[str]]


# Auth models
class RegisterRequest(BaseModel):
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: int
    email: str


# Document persistence models
class SaveDocumentRequest(BaseModel):
    doc_type: str
    title: str
    fields: dict[str, Optional[str]]


class UpdateDocumentRequest(BaseModel):
    title: Optional[str] = None
    fields: Optional[dict[str, Optional[str]]] = None


class DocumentRecord(BaseModel):
    id: int
    doc_type: str
    title: str
    fields: dict
    created_at: str
    updated_at: str


def _make_response_model(fields_model: type[BaseModel]) -> type[BaseModel]:
    return create_model(
        f"{fields_model.__name__}Response",
        message=(str, ...),
        fields=(fields_model, ...),
        is_complete=(bool, ...),
    )


# Pre-compute one response model per doc type (avoids re-creating Pydantic classes per request)
_RESPONSE_MODELS: dict[str, type[BaseModel]] = {
    doc_type: _make_response_model(cfg.fields_model)
    for doc_type, cfg in DOC_TYPE_CONFIGS.items()
}


# ============================================================
# DATABASE
# ============================================================

def init_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            doc_type TEXT NOT NULL,
            title TEXT NOT NULL,
            fields_json TEXT NOT NULL DEFAULT '{}',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# AUTH HELPERS
# ============================================================

def _hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode(), _bcrypt.gensalt()).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    return _bcrypt.checkpw(plain.encode(), hashed.encode())


# Pre-computed dummy hash used in login to prevent user-existence timing oracle
_DUMMY_HASH = _hash_password("prelegal-dummy-constant-value")


def _create_token(user_id: int) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(token: Optional[str] = Cookie(default=None)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute("SELECT id, email FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=401, detail="User not found")
    return {"id": row[0], "email": row[1]}


# ============================================================
# LLM HELPER
# ============================================================

def _llm_call(messages: list[dict], api_key: str, response_model: type[BaseModel]) -> BaseModel:
    response = completion(
        model=MODEL,
        messages=messages,
        response_format=response_model,
        reasoning_effort="low",
        extra_body=EXTRA_BODY,
        api_key=api_key,
    )
    return response_model.model_validate_json(response.choices[0].message.content)


# ============================================================
# API ENDPOINTS
# ============================================================

@app.get("/api/health")
def health():
    return JSONResponse({"status": "ok"})


# ── Auth ──────────────────────────────────────────────────────────────────────

@app.post("/api/auth/register")
def register(req: RegisterRequest, response: Response):
    if not req.email or not req.password:
        return JSONResponse({"error": "Email and password are required"}, status_code=400)
    if len(req.password) < 8:
        return JSONResponse({"error": "Password must be at least 8 characters"}, status_code=400)
    hashed = _hash_password(req.password)
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?) RETURNING id, email",
            (req.email.lower().strip(), hashed),
        )
        row = cursor.fetchone()
        conn.commit()
        conn.close()
    except sqlite3.IntegrityError:
        return JSONResponse({"error": "Email already registered"}, status_code=409)
    token = _create_token(row[0])
    response.set_cookie("token", token, httponly=True, samesite="lax", max_age=TOKEN_EXPIRE_DAYS * 86400)
    return {"id": row[0], "email": row[1]}


@app.post("/api/auth/login")
def login(req: LoginRequest, response: Response):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (req.email.lower().strip(),),
    ).fetchone()
    conn.close()
    # Always run bcrypt to prevent timing-based user enumeration
    candidate_hash = row[2] if row else _DUMMY_HASH
    if not row or not _verify_password(req.password, candidate_hash):
        return JSONResponse({"error": "Invalid email or password"}, status_code=401)
    token = _create_token(row[0])
    response.set_cookie("token", token, httponly=True, samesite="lax", max_age=TOKEN_EXPIRE_DAYS * 86400)
    return {"id": row[0], "email": row[1]}


@app.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("token")
    return {"ok": True}


@app.get("/api/auth/me")
def me(current_user: dict = Depends(get_current_user)):
    return current_user


# ── Document persistence ──────────────────────────────────────────────────────

@app.get("/api/documents")
def list_documents(current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        "SELECT id, doc_type, title, fields_json, created_at, updated_at FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
        (current_user["id"],),
    ).fetchall()
    conn.close()
    return [
        {"id": r[0], "doc_type": r[1], "title": r[2], "fields": json.loads(r[3]), "created_at": r[4], "updated_at": r[5]}
        for r in rows
    ]


@app.post("/api/documents")
def save_document(req: SaveDocumentRequest, current_user: dict = Depends(get_current_user)):
    if req.doc_type not in DOC_TYPE_CONFIGS:
        return JSONResponse({"error": f"Unknown document type: {req.doc_type}"}, status_code=400)
    now = datetime.now(timezone.utc).isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.execute(
        "INSERT INTO documents (user_id, doc_type, title, fields_json, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id",
        (current_user["id"], req.doc_type, req.title, json.dumps(req.fields), now, now),
    )
    doc_id = cursor.fetchone()[0]
    conn.commit()
    conn.close()
    return {"id": doc_id, "doc_type": req.doc_type, "title": req.title}


@app.get("/api/documents/{doc_id}")
def get_document(doc_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT id, doc_type, title, fields_json, created_at, updated_at FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, current_user["id"]),
    ).fetchone()
    conn.close()
    if not row:
        return JSONResponse({"error": "Document not found"}, status_code=404)
    return {"id": row[0], "doc_type": row[1], "title": row[2], "fields": json.loads(row[3]), "created_at": row[4], "updated_at": row[5]}


@app.put("/api/documents/{doc_id}")
def update_document(doc_id: int, req: UpdateDocumentRequest, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    row = conn.execute(
        "SELECT id, doc_type, title, fields_json FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, current_user["id"]),
    ).fetchone()
    if not row:
        conn.close()
        return JSONResponse({"error": "Document not found"}, status_code=404)
    new_title = req.title if req.title is not None else row[2]
    new_fields = json.dumps(req.fields) if req.fields is not None else row[3]
    now = datetime.now(timezone.utc).isoformat()
    conn.execute(
        "UPDATE documents SET title = ?, fields_json = ?, updated_at = ? WHERE id = ?",
        (new_title, new_fields, now, doc_id),
    )
    conn.commit()
    conn.close()
    return {"id": doc_id, "title": new_title, "updated_at": now}


@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: int, current_user: dict = Depends(get_current_user)):
    conn = sqlite3.connect(DB_PATH)
    result = conn.execute(
        "DELETE FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, current_user["id"]),
    )
    conn.commit()
    conn.close()
    if result.rowcount == 0:
        return JSONResponse({"error": "Document not found"}, status_code=404)
    return {"ok": True}


@app.get("/api/document-types")
def list_document_types():
    return JSONResponse([
        {"id": k, "name": v.name}
        for k, v in DOC_TYPE_CONFIGS.items()
    ])


@app.post("/api/document/chat")
def document_chat(req: DocumentChatRequest, current_user: dict = Depends(get_current_user)) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return JSONResponse({"error": "OpenRouter API key not configured"}, status_code=500)

    config = DOC_TYPE_CONFIGS.get(req.doc_type)
    if not config:
        return JSONResponse({"error": f"Unknown document type: {req.doc_type}"}, status_code=400)

    response_model = _RESPONSE_MODELS[req.doc_type]
    system_prompt = config.system_prompt_template.format(today=date.today().isoformat())
    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        return _llm_call(messages, api_key, response_model).model_dump()
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return JSONResponse({"error": "Failed to process request"}, status_code=500)


@app.post("/api/document/autofill")
def document_autofill(req: DocumentAutofillRequest, current_user: dict = Depends(get_current_user)) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return JSONResponse({"error": "OpenRouter API key not configured"}, status_code=500)

    config = DOC_TYPE_CONFIGS.get(req.doc_type)
    if not config:
        return JSONResponse({"error": f"Unknown document type: {req.doc_type}"}, status_code=400)

    response_model = _RESPONSE_MODELS[req.doc_type]
    autofill_prompt = config.autofill_prompt_template.format(today=date.today().isoformat())
    # Validate and coerce fields against the doc type's field model (drops unknown keys)
    typed_fields = config.fields_model.model_validate(req.fields)
    fields_json = typed_fields.model_dump_json()
    messages = [
        {"role": "system", "content": autofill_prompt},
        {"role": "user", "content": f"Here are the current field values: {fields_json}"},
    ]

    try:
        return _llm_call(messages, api_key, response_model).model_dump()
    except Exception as e:
        logger.error("LLM autofill failed: %s", e)
        return JSONResponse({"error": "Failed to process request"}, status_code=500)


# Legacy NDA endpoints (kept for backward compatibility)
@app.post("/api/nda/chat")
def nda_chat(req: ChatRequest) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return JSONResponse({"error": "OpenRouter API key not configured"}, status_code=500)

    config = DOC_TYPE_CONFIGS["mutual-nda"]
    response_model = _RESPONSE_MODELS["mutual-nda"]
    system_prompt = config.system_prompt_template.format(today=date.today().isoformat())
    messages = [{"role": "system", "content": system_prompt}]
    messages += [{"role": m.role, "content": m.content} for m in req.messages]

    try:
        return _llm_call(messages, api_key, response_model).model_dump()
    except Exception as e:
        logger.error("LLM call failed: %s", e)
        return JSONResponse({"error": "Failed to process request"}, status_code=500)


@app.post("/api/nda/autofill")
def nda_autofill(req: AutofillRequest) -> dict:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        return JSONResponse({"error": "OpenRouter API key not configured"}, status_code=500)

    config = DOC_TYPE_CONFIGS["mutual-nda"]
    response_model = _RESPONSE_MODELS["mutual-nda"]
    autofill_prompt = config.autofill_prompt_template.format(today=date.today().isoformat())
    messages = [
        {"role": "system", "content": autofill_prompt},
        {"role": "user", "content": f"Here are the current NDA field values: {req.fields.model_dump_json()}"},
    ]

    try:
        return _llm_call(messages, api_key, response_model).model_dump()
    except Exception as e:
        logger.error("LLM autofill failed: %s", e)
        return JSONResponse({"error": "Failed to process request"}, status_code=500)


# ============================================================
# STATIC FILE SERVING
# ============================================================

def _try_static(path: str) -> Path | None:
    candidates = [
        STATIC_DIR / path,
        STATIC_DIR / (path + ".html"),
        STATIC_DIR / path / "index.html",
    ]
    for candidate in candidates:
        if candidate.is_file():
            return candidate
    return None


@app.get("/{path:path}")
def serve_frontend(path: str):
    if not path:
        index = STATIC_DIR / "index.html"
        if index.is_file():
            return FileResponse(index)

    hit = _try_static(path)
    if hit:
        return FileResponse(hit)

    fallback = STATIC_DIR / "index.html"
    if fallback.is_file():
        return FileResponse(fallback)

    return JSONResponse({"error": "Not found"}, status_code=404)
