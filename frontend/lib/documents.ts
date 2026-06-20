export interface FieldDef {
  key: string
  label: string
  type: 'text' | 'textarea' | 'date' | 'select'
  options?: { value: string; label: string }[]
  placeholder?: string
  required?: boolean
  conditionalOn?: { field: string; value: string }
}

export interface FormSection {
  title: string
  fields: FieldDef[]
}

export interface FieldGroupItem {
  key: string
  label: string
}

export interface FieldGroup {
  label: string
  items: FieldGroupItem[]
}

export interface DocTypeConfig {
  id: string
  name: string
  description: string
  openingMessage: string
  fieldDefs: FieldDef[]
  formSections: FormSection[]
  fieldGroups: FieldGroup[]
  requiredFields: string[]
  sessionKey: string
  previewButtonLabel: string
}

// ============================================================
// MUTUAL NDA
// ============================================================

const ndaConfig: DocTypeConfig = {
  id: 'mutual-nda',
  name: 'Mutual NDA',
  description: 'Bilateral confidentiality agreement for two parties sharing sensitive or proprietary information.',
  openingMessage: "Hi! I'll help you draft a Mutual NDA. Let's start — what's the purpose of this agreement? For example, are you exploring a business partnership, vendor relationship, or investment discussion?",
  sessionKey: 'prelegal_draft_mutual-nda',
  previewButtonLabel: 'Preview NDA →',
  requiredFields: ['purpose', 'effectiveDate', 'mndaTermType', 'confidentialityTermType', 'governingLaw', 'jurisdiction', 'party1Name', 'party1Title', 'party1Company', 'party1Address', 'party2Name', 'party2Title', 'party2Company', 'party2Address', 'modifications'],
  fieldDefs: [
    { key: 'purpose', label: 'Purpose', type: 'textarea', required: true, placeholder: 'Why are parties sharing confidential information?' },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'mndaTermType', label: 'MNDA Term', type: 'select', required: true, options: [{ value: 'expires', label: 'Fixed term (expires)' }, { value: 'until_terminated', label: 'Until terminated' }] },
    { key: 'mndaTermYears', label: 'MNDA Term Years', type: 'text', placeholder: 'e.g. 1', conditionalOn: { field: 'mndaTermType', value: 'expires' } },
    { key: 'confidentialityTermType', label: 'Confidentiality Term', type: 'select', required: true, options: [{ value: 'years', label: 'Fixed years' }, { value: 'perpetuity', label: 'In perpetuity' }] },
    { key: 'confidentialityTermYears', label: 'Confidentiality Term Years', type: 'text', placeholder: 'e.g. 1', conditionalOn: { field: 'confidentialityTermType', value: 'years' } },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true, placeholder: 'e.g. Delaware' },
    { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true, placeholder: 'e.g. New Castle, Delaware' },
    { key: 'modifications', label: 'Modifications', type: 'textarea', required: true, placeholder: 'Leave blank if none' },
    { key: 'party1Name', label: 'Party 1 Name', type: 'text', required: true },
    { key: 'party1Title', label: 'Party 1 Title', type: 'text', required: true },
    { key: 'party1Company', label: 'Party 1 Company', type: 'text', required: true },
    { key: 'party1Address', label: 'Party 1 Address', type: 'textarea', required: true },
    { key: 'party2Name', label: 'Party 2 Name', type: 'text', required: true },
    { key: 'party2Title', label: 'Party 2 Title', type: 'text', required: true },
    { key: 'party2Company', label: 'Party 2 Company', type: 'text', required: true },
    { key: 'party2Address', label: 'Party 2 Address', type: 'textarea', required: true },
  ],
  formSections: [
    {
      title: 'Agreement Details',
      fields: [
        { key: 'purpose', label: 'Purpose', type: 'textarea', required: true },
        { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
        { key: 'mndaTermType', label: 'MNDA Term', type: 'select', required: true, options: [{ value: 'expires', label: 'Fixed term (expires)' }, { value: 'until_terminated', label: 'Until terminated' }] },
        { key: 'mndaTermYears', label: 'Term Years', type: 'text', placeholder: 'Number of years', conditionalOn: { field: 'mndaTermType', value: 'expires' } },
        { key: 'confidentialityTermType', label: 'Confidentiality Term', type: 'select', required: true, options: [{ value: 'years', label: 'Fixed years' }, { value: 'perpetuity', label: 'In perpetuity' }] },
        { key: 'confidentialityTermYears', label: 'Confidentiality Years', type: 'text', placeholder: 'Number of years', conditionalOn: { field: 'confidentialityTermType', value: 'years' } },
        { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true, placeholder: 'State name' },
        { key: 'jurisdiction', label: 'Jurisdiction', type: 'text', required: true, placeholder: 'City or county, state' },
        { key: 'modifications', label: 'Modifications', type: 'textarea', required: true, placeholder: 'Any changes to standard terms, or leave blank' },
      ],
    },
    {
      title: 'Party 1',
      fields: [
        { key: 'party1Name', label: 'Name', type: 'text', required: true },
        { key: 'party1Title', label: 'Title', type: 'text', required: true },
        { key: 'party1Company', label: 'Company', type: 'text', required: true },
        { key: 'party1Address', label: 'Notice Address', type: 'textarea', required: true },
      ],
    },
    {
      title: 'Party 2',
      fields: [
        { key: 'party2Name', label: 'Name', type: 'text', required: true },
        { key: 'party2Title', label: 'Title', type: 'text', required: true },
        { key: 'party2Company', label: 'Company', type: 'text', required: true },
        { key: 'party2Address', label: 'Notice Address', type: 'textarea', required: true },
      ],
    },
  ],
  fieldGroups: [
    {
      label: 'Agreement Details',
      items: [
        { key: 'purpose', label: 'Purpose' },
        { key: 'effectiveDate', label: 'Effective Date' },
        { key: 'mndaTermType', label: 'MNDA Term' },
        { key: 'confidentialityTermType', label: 'Confidentiality Term' },
        { key: 'governingLaw', label: 'Governing Law' },
        { key: 'jurisdiction', label: 'Jurisdiction' },
      ],
    },
    {
      label: 'Party 1',
      items: [
        { key: 'party1Name', label: 'Name' },
        { key: 'party1Title', label: 'Title' },
        { key: 'party1Company', label: 'Company' },
        { key: 'party1Address', label: 'Address' },
      ],
    },
    {
      label: 'Party 2',
      items: [
        { key: 'party2Name', label: 'Name' },
        { key: 'party2Title', label: 'Title' },
        { key: 'party2Company', label: 'Company' },
        { key: 'party2Address', label: 'Address' },
      ],
    },
  ],
}

// ============================================================
// DESIGN PARTNER AGREEMENT
// ============================================================

const designPartnerConfig: DocTypeConfig = {
  id: 'design-partner-agreement',
  name: 'Design Partner Agreement',
  description: 'Agreement for early-stage product design partnerships covering early access, feedback obligations, and confidentiality.',
  openingMessage: "Hi! I'll help you create a Design Partner Agreement. Let's start — tell me about the product being shared and what the design partner program involves.",
  sessionKey: 'prelegal_draft_design-partner-agreement',
  previewButtonLabel: 'Preview Agreement →',
  requiredFields: ['providerName', 'providerAddress', 'partnerName', 'partnerAddress', 'effectiveDate', 'term', 'productDescription', 'programDescription', 'fees', 'governingLaw', 'chosenCourts'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'partnerName', label: 'Partner Company', type: 'text', required: true },
    { key: 'partnerAddress', label: 'Partner Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'term', label: 'Term / Duration', type: 'text', required: true, placeholder: 'e.g. 6 months' },
    { key: 'productDescription', label: 'Product Description', type: 'textarea', required: true },
    { key: 'programDescription', label: 'Program Description', type: 'textarea', required: true },
    { key: 'fees', label: 'Fees', type: 'text', required: true, placeholder: 'e.g. None, or $5,000' },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true, placeholder: 'e.g. California' },
    { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true, placeholder: 'e.g. courts in San Francisco, CA' },
  ],
  formSections: [
    {
      title: 'Provider',
      fields: [
        { key: 'providerName', label: 'Company Name', type: 'text', required: true },
        { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true },
      ],
    },
    {
      title: 'Partner',
      fields: [
        { key: 'partnerName', label: 'Company Name', type: 'text', required: true },
        { key: 'partnerAddress', label: 'Notice Address', type: 'textarea', required: true },
      ],
    },
    {
      title: 'Agreement Details',
      fields: [
        { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
        { key: 'term', label: 'Term / Duration', type: 'text', required: true, placeholder: 'e.g. 6 months' },
        { key: 'productDescription', label: 'Product Description', type: 'textarea', required: true },
        { key: 'programDescription', label: 'Program Description', type: 'textarea', required: true },
        { key: 'fees', label: 'Fees (or "None")', type: 'text', required: true },
        { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
        { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
      ],
    },
  ],
  fieldGroups: [
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Partner', items: [{ key: 'partnerName', label: 'Company' }, { key: 'partnerAddress', label: 'Address' }] },
    { label: 'Agreement', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'term', label: 'Term' }, { key: 'productDescription', label: 'Product' }, { key: 'fees', label: 'Fees' }, { key: 'governingLaw', label: 'Governing Law' }] },
  ],
}

// ============================================================
// PILOT AGREEMENT
// ============================================================

const pilotConfig: DocTypeConfig = {
  id: 'pilot-agreement',
  name: 'Pilot Agreement',
  description: 'Time-limited agreement for product pilots and proof-of-concept trials with optional conversion to full subscription.',
  openingMessage: "Hi! I'll help you create a Pilot Agreement. Let's start — what product is being piloted and who are the two parties?",
  sessionKey: 'prelegal_draft_pilot-agreement',
  previewButtonLabel: 'Preview Agreement →',
  requiredFields: ['providerName', 'providerAddress', 'customerName', 'customerAddress', 'effectiveDate', 'pilotPeriod', 'productDescription', 'generalCapAmount', 'governingLaw', 'chosenCourts', 'noticeAddress'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'customerName', label: 'Customer Company', type: 'text', required: true },
    { key: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'pilotPeriod', label: 'Pilot Period', type: 'text', required: true, placeholder: 'e.g. 30 days, 3 months' },
    { key: 'productDescription', label: 'Product Description', type: 'textarea', required: true },
    { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true, placeholder: 'e.g. $10,000' },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true, placeholder: 'e.g. Delaware' },
    { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
    { key: 'noticeAddress', label: 'Notice Address', type: 'text', required: true, placeholder: 'Email or postal address' },
  ],
  formSections: [
    { title: 'Provider', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Customer', fields: [{ key: 'customerName', label: 'Company Name', type: 'text', required: true }, { key: 'customerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Pilot Details', fields: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'pilotPeriod', label: 'Pilot Period', type: 'text', required: true, placeholder: 'e.g. 30 days' },
      { key: 'productDescription', label: 'Product Description', type: 'textarea', required: true },
      { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true, placeholder: 'e.g. $10,000' },
      { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
      { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
      { key: 'noticeAddress', label: 'General Notice Address', type: 'text', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Customer', items: [{ key: 'customerName', label: 'Company' }, { key: 'customerAddress', label: 'Address' }] },
    { label: 'Pilot', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'pilotPeriod', label: 'Period' }, { key: 'productDescription', label: 'Product' }, { key: 'generalCapAmount', label: 'Liability Cap' }] },
  ],
}

// ============================================================
// AI ADDENDUM
// ============================================================

const aiAddendumConfig: DocTypeConfig = {
  id: 'ai-addendum',
  name: 'AI Addendum',
  description: 'Addendum to an existing agreement covering AI-specific provisions: data use, model training, and acceptable use policies.',
  openingMessage: "Hi! I'll help you create an AI Addendum to an existing agreement. What is the name of the underlying agreement this will attach to?",
  sessionKey: 'prelegal_draft_ai-addendum',
  previewButtonLabel: 'Preview Addendum →',
  requiredFields: ['customerName', 'customerAddress', 'providerName', 'providerAddress', 'effectiveDate', 'agreementName', 'allowTraining', 'improvementRestrictions'],
  fieldDefs: [
    { key: 'customerName', label: 'Customer Company', type: 'text', required: true },
    { key: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'agreementName', label: 'Underlying Agreement', type: 'text', required: true, placeholder: 'e.g. Cloud Service Agreement dated Jan 1, 2025' },
    { key: 'allowTraining', label: 'Allow Model Training', type: 'select', required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
    { key: 'trainingData', label: 'Training Data Description', type: 'textarea', conditionalOn: { field: 'allowTraining', value: 'yes' } },
    { key: 'trainingPurposes', label: 'Training Purposes', type: 'textarea', conditionalOn: { field: 'allowTraining', value: 'yes' } },
    { key: 'trainingRestrictions', label: 'Training Restrictions', type: 'textarea', conditionalOn: { field: 'allowTraining', value: 'yes' } },
    { key: 'improvementRestrictions', label: 'Improvement Restrictions', type: 'textarea', required: true, placeholder: 'Restrictions on product improvement use, or "None"' },
  ],
  formSections: [
    { title: 'Customer', fields: [{ key: 'customerName', label: 'Company Name', type: 'text', required: true }, { key: 'customerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Provider', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Addendum Details', fields: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'agreementName', label: 'Underlying Agreement', type: 'text', required: true },
      { key: 'allowTraining', label: 'Allow Model Training', type: 'select', required: true, options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }] },
      { key: 'trainingData', label: 'Training Data', type: 'textarea', conditionalOn: { field: 'allowTraining', value: 'yes' } },
      { key: 'trainingPurposes', label: 'Training Purposes', type: 'textarea', conditionalOn: { field: 'allowTraining', value: 'yes' } },
      { key: 'trainingRestrictions', label: 'Training Restrictions', type: 'textarea', conditionalOn: { field: 'allowTraining', value: 'yes' } },
      { key: 'improvementRestrictions', label: 'Improvement Restrictions', type: 'textarea', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Parties', items: [{ key: 'customerName', label: 'Customer' }, { key: 'providerName', label: 'Provider' }] },
    { label: 'Details', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'agreementName', label: 'Underlying Agreement' }, { key: 'allowTraining', label: 'Allow Training' }, { key: 'improvementRestrictions', label: 'Improvement Restrictions' }] },
  ],
}

// ============================================================
// BAA
// ============================================================

const baaConfig: DocTypeConfig = {
  id: 'baa',
  name: 'Business Associate Agreement',
  description: 'HIPAA-compliant agreement governing protected health information (PHI) between covered entities and business associates.',
  openingMessage: "Hi! I'll help you create a Business Associate Agreement (BAA). Who are the Provider (business associate providing services) and the Company (the HIPAA-covered entity)?",
  sessionKey: 'prelegal_draft_baa',
  previewButtonLabel: 'Preview BAA →',
  requiredFields: ['providerName', 'providerAddress', 'companyName', 'companyAddress', 'agreementName', 'baaEffectiveDate', 'breachNotificationPeriod', 'limitations'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'companyName', label: 'Covered Entity Company', type: 'text', required: true },
    { key: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
    { key: 'agreementName', label: 'Underlying Agreement', type: 'text', required: true, placeholder: 'e.g. Software Services Agreement dated Jan 1, 2025' },
    { key: 'baaEffectiveDate', label: 'BAA Effective Date', type: 'date', required: true },
    { key: 'breachNotificationPeriod', label: 'Breach Notification Period', type: 'text', required: true, placeholder: 'e.g. 72 hours, 30 days' },
    { key: 'limitations', label: 'PHI Limitations', type: 'textarea', required: true, placeholder: 'Restrictions on offshoring, de-identification, aggregation — or "None"' },
  ],
  formSections: [
    { title: 'Provider (Business Associate)', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Company (Covered Entity)', fields: [{ key: 'companyName', label: 'Company Name', type: 'text', required: true }, { key: 'companyAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'BAA Details', fields: [
      { key: 'agreementName', label: 'Underlying Agreement', type: 'text', required: true },
      { key: 'baaEffectiveDate', label: 'BAA Effective Date', type: 'date', required: true },
      { key: 'breachNotificationPeriod', label: 'Breach Notification Period', type: 'text', required: true },
      { key: 'limitations', label: 'PHI Limitations', type: 'textarea', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Company', items: [{ key: 'companyName', label: 'Company' }, { key: 'companyAddress', label: 'Address' }] },
    { label: 'BAA Details', items: [{ key: 'agreementName', label: 'Agreement' }, { key: 'baaEffectiveDate', label: 'Effective Date' }, { key: 'breachNotificationPeriod', label: 'Breach Period' }, { key: 'limitations', label: 'Limitations' }] },
  ],
}

// ============================================================
// CSA
// ============================================================

const csaConfig: DocTypeConfig = {
  id: 'csa',
  name: 'Cloud Service Agreement',
  description: 'Comprehensive agreement for cloud-hosted software covering subscription terms, support, security, and data handling.',
  openingMessage: "Hi! I'll help you create a Cloud Service Agreement. Let's start — who is the Provider (cloud service company) and who is the Customer?",
  sessionKey: 'prelegal_draft_csa',
  previewButtonLabel: 'Preview CSA →',
  requiredFields: ['providerName', 'providerAddress', 'customerName', 'customerAddress', 'effectiveDate', 'productDescription', 'subscriptionPeriod', 'fees', 'paymentProcess', 'generalCapAmount', 'technicalSupport', 'dpa', 'governingLaw', 'chosenCourts'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'customerName', label: 'Customer Company', type: 'text', required: true },
    { key: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'productDescription', label: 'Product / Service Description', type: 'textarea', required: true },
    { key: 'subscriptionPeriod', label: 'Subscription Period', type: 'text', required: true, placeholder: 'e.g. 12 months' },
    { key: 'fees', label: 'Fees', type: 'text', required: true, placeholder: 'e.g. $500/month' },
    { key: 'paymentProcess', label: 'Payment Process', type: 'text', required: true, placeholder: 'e.g. Net-30 invoicing' },
    { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true, placeholder: 'e.g. $10,000' },
    { key: 'technicalSupport', label: 'Technical Support', type: 'text', required: true, placeholder: 'e.g. Email support during business hours' },
    { key: 'dpa', label: 'DPA Reference', type: 'text', required: true, placeholder: 'e.g. Exhibit A, or "None"' },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true, placeholder: 'e.g. New York' },
    { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
  ],
  formSections: [
    { title: 'Provider', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Customer', fields: [{ key: 'customerName', label: 'Company Name', type: 'text', required: true }, { key: 'customerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Agreement Details', fields: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'productDescription', label: 'Product / Service Description', type: 'textarea', required: true },
      { key: 'subscriptionPeriod', label: 'Subscription Period', type: 'text', required: true },
      { key: 'fees', label: 'Fees', type: 'text', required: true },
      { key: 'paymentProcess', label: 'Payment Process', type: 'text', required: true },
      { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true },
      { key: 'technicalSupport', label: 'Technical Support', type: 'text', required: true },
      { key: 'dpa', label: 'DPA Reference', type: 'text', required: true },
      { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
      { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Customer', items: [{ key: 'customerName', label: 'Company' }, { key: 'customerAddress', label: 'Address' }] },
    { label: 'Terms', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'subscriptionPeriod', label: 'Subscription' }, { key: 'fees', label: 'Fees' }, { key: 'paymentProcess', label: 'Payment' }, { key: 'governingLaw', label: 'Governing Law' }] },
  ],
}

// ============================================================
// DPA
// ============================================================

const dpaConfig: DocTypeConfig = {
  id: 'dpa',
  name: 'Data Processing Agreement',
  description: 'GDPR-aligned agreement governing the processing of personal data by a service provider on behalf of a data controller.',
  openingMessage: "Hi! I'll help you create a Data Processing Agreement (DPA). Who is the Customer (data controller) and who is the Provider (data processor)?",
  sessionKey: 'prelegal_draft_dpa',
  previewButtonLabel: 'Preview DPA →',
  requiredFields: ['customerName', 'customerAddress', 'providerName', 'providerAddress', 'agreementName', 'categoriesOfPersonalData', 'categoriesOfDataSubjects', 'governingMemberState', 'approvedSubprocessors'],
  fieldDefs: [
    { key: 'customerName', label: 'Customer (Controller) Company', type: 'text', required: true },
    { key: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { key: 'providerName', label: 'Provider (Processor) Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'agreementName', label: 'Underlying Agreement', type: 'text', required: true, placeholder: 'e.g. Cloud Service Agreement dated Jan 1, 2025' },
    { key: 'categoriesOfPersonalData', label: 'Categories of Personal Data', type: 'textarea', required: true, placeholder: 'e.g. Name, email, IP address, usage data' },
    { key: 'categoriesOfDataSubjects', label: 'Categories of Data Subjects', type: 'textarea', required: true, placeholder: 'e.g. Customer employees, end users' },
    { key: 'governingMemberState', label: 'Governing EU Member State', type: 'text', required: true, placeholder: 'e.g. Germany, Ireland' },
    { key: 'approvedSubprocessors', label: 'Approved Subprocessors', type: 'textarea', required: true, placeholder: 'e.g. AWS (US), Stripe (US) — or "None"' },
  ],
  formSections: [
    { title: 'Customer (Controller)', fields: [{ key: 'customerName', label: 'Company Name', type: 'text', required: true }, { key: 'customerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Provider (Processor)', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Processing Details', fields: [
      { key: 'agreementName', label: 'Underlying Agreement', type: 'text', required: true },
      { key: 'categoriesOfPersonalData', label: 'Categories of Personal Data', type: 'textarea', required: true },
      { key: 'categoriesOfDataSubjects', label: 'Categories of Data Subjects', type: 'textarea', required: true },
      { key: 'governingMemberState', label: 'Governing EU Member State', type: 'text', required: true },
      { key: 'approvedSubprocessors', label: 'Approved Subprocessors', type: 'textarea', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Customer', items: [{ key: 'customerName', label: 'Company' }, { key: 'customerAddress', label: 'Address' }] },
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Processing', items: [{ key: 'categoriesOfPersonalData', label: 'Data Categories' }, { key: 'categoriesOfDataSubjects', label: 'Data Subjects' }, { key: 'governingMemberState', label: 'Member State' }, { key: 'approvedSubprocessors', label: 'Subprocessors' }] },
  ],
}

// ============================================================
// SOFTWARE LICENSE AGREEMENT
// ============================================================

const softwareLicenseConfig: DocTypeConfig = {
  id: 'software-license-agreement',
  name: 'Software License Agreement',
  description: 'Enterprise on-premise software license covering grant of rights, restrictions, maintenance, support, and warranty terms.',
  openingMessage: "Hi! I'll help you create a Software License Agreement. Let's start — what software is being licensed and who are the parties?",
  sessionKey: 'prelegal_draft_software-license-agreement',
  previewButtonLabel: 'Preview Agreement →',
  requiredFields: ['providerName', 'providerAddress', 'customerName', 'customerAddress', 'effectiveDate', 'productDescription', 'subscriptionPeriod', 'permittedUses', 'licenseLimits', 'fees', 'paymentProcess', 'warrantyPeriod', 'deletionProcedure', 'governingLaw', 'chosenCourts'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'customerName', label: 'Customer Company', type: 'text', required: true },
    { key: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'productDescription', label: 'Software Description', type: 'textarea', required: true },
    { key: 'subscriptionPeriod', label: 'License Period', type: 'text', required: true, placeholder: 'e.g. 12 months, 3 years' },
    { key: 'permittedUses', label: 'Permitted Uses', type: 'textarea', required: true, placeholder: 'e.g. Internal business operations' },
    { key: 'licenseLimits', label: 'License Limits', type: 'text', required: true, placeholder: 'e.g. Up to 50 named users' },
    { key: 'fees', label: 'Fees', type: 'text', required: true, placeholder: 'e.g. $50,000/year' },
    { key: 'paymentProcess', label: 'Payment Process', type: 'text', required: true, placeholder: 'e.g. Annual invoice, Net-30' },
    { key: 'warrantyPeriod', label: 'Warranty Period', type: 'text', required: true, placeholder: 'e.g. 90 days' },
    { key: 'deletionProcedure', label: 'Data Deletion Procedure', type: 'textarea', required: true },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
    { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
  ],
  formSections: [
    { title: 'Provider', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Customer', fields: [{ key: 'customerName', label: 'Company Name', type: 'text', required: true }, { key: 'customerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'License Details', fields: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'productDescription', label: 'Software Description', type: 'textarea', required: true },
      { key: 'subscriptionPeriod', label: 'License Period', type: 'text', required: true },
      { key: 'permittedUses', label: 'Permitted Uses', type: 'textarea', required: true },
      { key: 'licenseLimits', label: 'License Limits', type: 'text', required: true },
      { key: 'fees', label: 'Fees', type: 'text', required: true },
      { key: 'paymentProcess', label: 'Payment Process', type: 'text', required: true },
      { key: 'warrantyPeriod', label: 'Warranty Period', type: 'text', required: true },
      { key: 'deletionProcedure', label: 'Data Deletion Procedure', type: 'textarea', required: true },
      { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
      { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Customer', items: [{ key: 'customerName', label: 'Company' }, { key: 'customerAddress', label: 'Address' }] },
    { label: 'License', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'subscriptionPeriod', label: 'Period' }, { key: 'fees', label: 'Fees' }, { key: 'governingLaw', label: 'Governing Law' }] },
  ],
}

// ============================================================
// PARTNERSHIP AGREEMENT
// ============================================================

const partnershipConfig: DocTypeConfig = {
  id: 'partnership-agreement',
  name: 'Partnership Agreement',
  description: 'Agreement governing reseller, referral, and channel partner relationships including compensation and IP ownership.',
  openingMessage: "Hi! I'll help you create a Partnership Agreement. Who are the two companies entering into this partnership?",
  sessionKey: 'prelegal_draft_partnership-agreement',
  previewButtonLabel: 'Preview Agreement →',
  requiredFields: ['companyName', 'companyAddress', 'partnerName', 'partnerAddress', 'effectiveDate', 'endDate', 'obligations', 'paymentProcess', 'paymentSchedule', 'territory', 'brandGuidelines', 'generalCapAmount', 'governingLaw', 'chosenCourts'],
  fieldDefs: [
    { key: 'companyName', label: 'Company (Licensor)', type: 'text', required: true },
    { key: 'companyAddress', label: 'Company Address', type: 'textarea', required: true },
    { key: 'partnerName', label: 'Partner (Licensee)', type: 'text', required: true },
    { key: 'partnerAddress', label: 'Partner Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'endDate', label: 'End Date', type: 'date', required: true },
    { key: 'obligations', label: 'Obligations', type: 'textarea', required: true, placeholder: 'What each party will do under this partnership' },
    { key: 'paymentProcess', label: 'Payment Process', type: 'text', required: true, placeholder: 'e.g. Monthly invoices, Net-30 — or "None"' },
    { key: 'paymentSchedule', label: 'Payment Schedule', type: 'text', required: true, placeholder: 'e.g. Monthly on the 1st — or "None"' },
    { key: 'territory', label: 'Territory', type: 'text', required: true, placeholder: 'e.g. United States, North America' },
    { key: 'brandGuidelines', label: 'Brand Guidelines', type: 'text', required: true, placeholder: 'e.g. company.com/brand — or "None"' },
    { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true, placeholder: 'e.g. $50,000' },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
    { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
  ],
  formSections: [
    { title: 'Company (Licensor)', fields: [{ key: 'companyName', label: 'Company Name', type: 'text', required: true }, { key: 'companyAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Partner (Licensee)', fields: [{ key: 'partnerName', label: 'Company Name', type: 'text', required: true }, { key: 'partnerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Partnership Terms', fields: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'endDate', label: 'End Date', type: 'date', required: true },
      { key: 'obligations', label: 'Obligations', type: 'textarea', required: true },
      { key: 'paymentProcess', label: 'Payment Process', type: 'text', required: true },
      { key: 'paymentSchedule', label: 'Payment Schedule', type: 'text', required: true },
      { key: 'territory', label: 'Territory', type: 'text', required: true },
      { key: 'brandGuidelines', label: 'Brand Guidelines', type: 'text', required: true },
      { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true },
      { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
      { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Company', items: [{ key: 'companyName', label: 'Company' }, { key: 'companyAddress', label: 'Address' }] },
    { label: 'Partner', items: [{ key: 'partnerName', label: 'Company' }, { key: 'partnerAddress', label: 'Address' }] },
    { label: 'Terms', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'endDate', label: 'End Date' }, { key: 'territory', label: 'Territory' }, { key: 'governingLaw', label: 'Governing Law' }] },
  ],
}

// ============================================================
// PSA
// ============================================================

const psaConfig: DocTypeConfig = {
  id: 'psa',
  name: 'Professional Services Agreement',
  description: 'Agreement for professional and consulting services including statements of work, deliverables, IP ownership, and payment terms.',
  openingMessage: "Hi! I'll help you create a Professional Services Agreement. Who is the Provider (consultant) and who is the Customer?",
  sessionKey: 'prelegal_draft_psa',
  previewButtonLabel: 'Preview PSA →',
  requiredFields: ['providerName', 'providerAddress', 'customerName', 'customerAddress', 'effectiveDate', 'securityPolicy', 'customerPolicies', 'dpa', 'governingLaw', 'chosenCourts', 'generalCapAmount'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'providerAddress', label: 'Provider Address', type: 'textarea', required: true },
    { key: 'customerName', label: 'Customer Company', type: 'text', required: true },
    { key: 'customerAddress', label: 'Customer Address', type: 'textarea', required: true },
    { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
    { key: 'securityPolicy', label: 'Security Policy', type: 'text', required: true, placeholder: 'e.g. URL to policy — or "None"' },
    { key: 'customerPolicies', label: 'Customer Policies', type: 'text', required: true, placeholder: 'Policies provider must follow — or "None"' },
    { key: 'dpa', label: 'DPA Reference', type: 'text', required: true, placeholder: 'e.g. Exhibit A — or "None"' },
    { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
    { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
    { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true, placeholder: 'e.g. $100,000' },
  ],
  formSections: [
    { title: 'Provider', fields: [{ key: 'providerName', label: 'Company Name', type: 'text', required: true }, { key: 'providerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Customer', fields: [{ key: 'customerName', label: 'Company Name', type: 'text', required: true }, { key: 'customerAddress', label: 'Notice Address', type: 'textarea', required: true }] },
    { title: 'Agreement Details', fields: [
      { key: 'effectiveDate', label: 'Effective Date', type: 'date', required: true },
      { key: 'securityPolicy', label: 'Security Policy', type: 'text', required: true },
      { key: 'customerPolicies', label: 'Customer Policies', type: 'text', required: true },
      { key: 'dpa', label: 'DPA Reference', type: 'text', required: true },
      { key: 'governingLaw', label: 'Governing Law', type: 'text', required: true },
      { key: 'chosenCourts', label: 'Chosen Courts', type: 'text', required: true },
      { key: 'generalCapAmount', label: 'Liability Cap', type: 'text', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Provider', items: [{ key: 'providerName', label: 'Company' }, { key: 'providerAddress', label: 'Address' }] },
    { label: 'Customer', items: [{ key: 'customerName', label: 'Company' }, { key: 'customerAddress', label: 'Address' }] },
    { label: 'Terms', items: [{ key: 'effectiveDate', label: 'Effective Date' }, { key: 'governingLaw', label: 'Governing Law' }, { key: 'generalCapAmount', label: 'Liability Cap' }] },
  ],
}

// ============================================================
// SLA
// ============================================================

const slaConfig: DocTypeConfig = {
  id: 'sla',
  name: 'Service Level Agreement',
  description: 'Defines uptime commitments, response time targets, measurement methodology, and service credits for cloud services.',
  openingMessage: "Hi! I'll help you create a Service Level Agreement. Who is the cloud service Provider and who is the Customer?",
  sessionKey: 'prelegal_draft_sla',
  previewButtonLabel: 'Preview SLA →',
  requiredFields: ['providerName', 'customerName', 'targetUptime', 'targetResponseTime', 'supportChannel', 'uptimeCredit', 'responseTimeCredit', 'scheduledDowntime'],
  fieldDefs: [
    { key: 'providerName', label: 'Provider Company', type: 'text', required: true },
    { key: 'customerName', label: 'Customer Company', type: 'text', required: true },
    { key: 'targetUptime', label: 'Target Uptime', type: 'text', required: true, placeholder: 'e.g. 99.9%' },
    { key: 'targetResponseTime', label: 'Target Response Time', type: 'text', required: true, placeholder: 'e.g. 4 business hours' },
    { key: 'supportChannel', label: 'Support Channel', type: 'text', required: true, placeholder: 'e.g. support@company.com' },
    { key: 'uptimeCredit', label: 'Uptime Credit', type: 'text', required: true, placeholder: 'e.g. 10% of monthly fees' },
    { key: 'responseTimeCredit', label: 'Response Time Credit', type: 'text', required: true, placeholder: 'e.g. 5% of monthly fees' },
    { key: 'scheduledDowntime', label: 'Scheduled Downtime', type: 'text', required: true, placeholder: 'e.g. 4 hours/month with 24hr notice — or "None"' },
  ],
  formSections: [
    { title: 'Parties', fields: [{ key: 'providerName', label: 'Provider Company', type: 'text', required: true }, { key: 'customerName', label: 'Customer Company', type: 'text', required: true }] },
    { title: 'SLA Terms', fields: [
      { key: 'targetUptime', label: 'Target Uptime', type: 'text', required: true },
      { key: 'targetResponseTime', label: 'Target Response Time', type: 'text', required: true },
      { key: 'supportChannel', label: 'Support Channel', type: 'text', required: true },
      { key: 'uptimeCredit', label: 'Uptime Credit', type: 'text', required: true },
      { key: 'responseTimeCredit', label: 'Response Time Credit', type: 'text', required: true },
      { key: 'scheduledDowntime', label: 'Scheduled Downtime', type: 'text', required: true },
    ]},
  ],
  fieldGroups: [
    { label: 'Parties', items: [{ key: 'providerName', label: 'Provider' }, { key: 'customerName', label: 'Customer' }] },
    { label: 'SLA Terms', items: [{ key: 'targetUptime', label: 'Target Uptime' }, { key: 'targetResponseTime', label: 'Response Time' }, { key: 'supportChannel', label: 'Support Channel' }, { key: 'uptimeCredit', label: 'Uptime Credit' }] },
  ],
}

// ============================================================
// MASTER CATALOG
// ============================================================

export const DOC_CONFIGS: Record<string, DocTypeConfig> = {
  'mutual-nda': ndaConfig,
  'design-partner-agreement': designPartnerConfig,
  'pilot-agreement': pilotConfig,
  'ai-addendum': aiAddendumConfig,
  'baa': baaConfig,
  'csa': csaConfig,
  'dpa': dpaConfig,
  'software-license-agreement': softwareLicenseConfig,
  'partnership-agreement': partnershipConfig,
  'psa': psaConfig,
  'sla': slaConfig,
}

export const DOC_TYPE_IDS = Object.keys(DOC_CONFIGS)

export function getDocConfig(docType: string): DocTypeConfig | null {
  return DOC_CONFIGS[docType] ?? null
}

export function isFieldRequired(field: FieldDef, fields: Record<string, string>): boolean {
  if (field.conditionalOn) {
    return fields[field.conditionalOn.field] === field.conditionalOn.value
  }
  return field.required ?? false
}

export function isDocComplete(fields: Record<string, string>, config: DocTypeConfig): boolean {
  for (const field of config.fieldDefs) {
    if (!isFieldRequired(field, fields)) continue
    if (!fields[field.key]?.trim()) return false
  }
  return true
}

export function defaultFields(config: DocTypeConfig): Record<string, string> {
  const result: Record<string, string> = {}
  for (const field of config.fieldDefs) {
    result[field.key] = ''
  }
  return result
}
