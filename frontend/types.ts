export interface BasicComponent {
  __component: string
}

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

type ImageFormat = {
  ext: string
  url: string
  hash: string
  mime: string
  name: string
  path: string | null
  size: number
  width: number
  height: number
  sizeInBytes: number
}
export type Image = {
  id: number
  documentId: string
  name: string
  alternativeText: string | null
  caption: string | null
  width: number
  height: number
  previewUrl: string | null
  url: string
  provider: string
  createdAt: string
  updatedAt: string
  publishedAt: string
  formats: {
    large: ImageFormat
    medium: ImageFormat
    small: ImageFormat
    thumbnail: ImageFormat
  }
}
