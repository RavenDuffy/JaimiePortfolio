import { stringify } from "qs"

const apiUrl = `${process.env.STRAPI_URL}/api`

const defaultHeaders = {
  Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
}

const request = async (path: string, options = {}) => {
  const fetchOptions = {
    next: { tags: ["strapi"] },
    headers: {},
    ...options,
  }

  fetchOptions.headers = fetchOptions.hasOwnProperty("headers")
    ? { ...defaultHeaders, ...fetchOptions.headers }
    : { ...defaultHeaders }

  const response = await fetch(`${apiUrl}/${path}`, fetchOptions)

  return await response.json()
}

export const get = async (path: string, params) => {
  const query = params ? `?${stringify(params)}` : ""
  return await request(`${path}${query}`, params)
}

export const getByType = async (contentType: string, params = {}) => {
  return await get(contentType, params)
}

export const getAllByType = async (contentType: string, params = {}) => {
  const entries = []
  const maxPages = 10

  let currentPage = 1
  let morePages = true

  while (morePages === true && currentPage <= maxPages) {
    const query = await get(contentType, {
      ...params,
      pagination: {
        page: currentPage,
        pageSize: 10,
      },
    })

    if (query && query?.data?.length > 0) {
      query.data.forEach((entry) => entries.push(entry))

      if (
        typeof query.meta.pagination === `undefined` ||
        currentPage === query.meta.pagination.total
      ) {
        morePages = false
      } else {
        currentPage++
      }
    } else {
      morePages = false
    }
  }

  return entries
}
