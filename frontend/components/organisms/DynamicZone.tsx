import { BasicComponent } from "@/types"
import ImageAndText from "../molecules/ImageAndText"

import type { JSX } from "react";

const componentList: { [key: string]: JSX.ElementType } = {
  "blocks.image-and-text": ImageAndText,
}

const DynamicZone = ({ components }: { components: BasicComponent[] }) => {
  return components.map(({ __component, ...data }, index: number) => {
    const Component = componentList[__component]

    if (typeof Component === `undefined`) {
      return (
        <div key={`dynamic-zone-component-${index}`}>
          Component <strong>{__component}</strong> not found
        </div>
      )
    } else {
      return <Component key={`dynamic-zone-component-${index}`} {...data} />
    }
  })
}

export default DynamicZone
