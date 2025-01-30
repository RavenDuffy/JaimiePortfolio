import type { Image } from "@/types"
import { default as NextImage } from "next/image"

const BaseImage = ({
  image,
  height = "auto",
  width = "100%",
}: {
  image: Image
  height?: string
  width?: string
}) => {
  // local image
  if (image.provider === "local") {
    return (
      <NextImage
        src={`${process.env.STRAPI_URL}${image.url}`}
        alt={image.alternativeText ?? "unknown"}
        sizes="100vw"
        style={{ width, height }}
        width="0"
        height="0"
      />
    )
  }

  // aws image
  else if (image.provider === "aws-s3") {
    return (
      <NextImage
        src={image.url}
        alt={image.alternativeText ?? "unknown"}
        sizes="100vw"
        style={{ width, height }}
        width="0"
        height="0"
      />
    )
  }
}

export default BaseImage
