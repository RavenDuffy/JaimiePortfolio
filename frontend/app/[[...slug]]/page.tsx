import { getAllByType, getByType } from "@/helpers/strapi"
import { PageParams } from "@/types"

export async function generateStaticParams() {
  const pages = await getAllByType("pages")

  const settings = await getByType("site-setting", {
    populate: {
      homePage: {
        populate: "*",
      },
    },
  })
  const homePageSlug = settings.data?.attributes.homePage?.data?.attributes.slug

  return pages.map((page) => {
    const isIndex =
      typeof homePageSlug === "string" && homePageSlug === page.attributes.slug

    return {
      slug: !isIndex ? [`${page.attributes.slug}`] : undefined,
    }
  })
}

export async function generateMetadata({ params }: PageParams) {
  let slug = params.slug?.[0] ?? params.slug
  if (typeof params.slug === "undefined") {
    const settings = await getByType("site-setting", {
      populate: {
        homePage: {
          populate: "*",
        },
      },
    })
    slug = settings.data?.attributes.homePage?.data?.attributes.slug

    if (typeof slug !== "string") {
      return
    }
  }

  return {
    title: slug,
  }
}

export default async function Page({ params }: PageParams) {
  let slug = params.slug?.[0] ?? params.slug

  if (typeof params.slug === "undefined") {
    const settings = await getByType("site-setting", {
      populate: {
        homePage: {
          populate: "*",
        },
      },
    })
    slug = settings.data?.attributes.homePage?.data?.attributes.slug

    if (typeof slug !== "string") {
      return
    }
  }

  const pages = await getByType("pages", {
    filters: {
      slug: {
        $eq: slug,
      },
    },
    populate: {
      body: {
        populate: "*",
      },
    },
  })

  if (pages.data === null || pages.data.length === 0) {
    return
  }

  const [page] = pages.data

  return <>{page.attributes.title}</>
}
