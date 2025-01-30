import type { Image } from "@/types"
import BaseImage from "../atoms/BaseImage"
import Wrapper from "../atoms/Wrapper"

const ImageAndText = ({
  image,
  text,
  width,
  height,
}: {
  image: Image
  text: string
  width?: string
  height?: string
}) => {
  return (
    <Wrapper>
      {image && <BaseImage image={image} width={width} height={height} />}
      {text && <p>{text}</p>}
    </Wrapper>
  )
}

export default ImageAndText
