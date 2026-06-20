import { DOC_TYPE_IDS } from '@/lib/documents'
import PreviewClient from './preview-client'

export function generateStaticParams() {
  return DOC_TYPE_IDS.map((docType) => ({ docType }))
}

type Props = { params: Promise<{ docType: string }> }

export default async function PreviewPage({ params }: Props) {
  const { docType } = await params
  return <PreviewClient docType={docType} />
}
