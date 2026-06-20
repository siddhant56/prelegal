import { DOC_TYPE_IDS } from '@/lib/documents'
import CreateClient from './create-client'

export function generateStaticParams() {
  return DOC_TYPE_IDS.map((docType) => ({ docType }))
}

type Props = { params: Promise<{ docType: string }> }

export default async function CreatePage({ params }: Props) {
  const { docType } = await params
  return <CreateClient docType={docType} />
}
