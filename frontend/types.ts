export type PageParams = {
  params: {
    slug: string[] | undefined
  }
}

export interface Page {
  id: number
  documentId: string
  slug: string
  body: unknown
}
