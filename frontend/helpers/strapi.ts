import qs from "qs"

const apiUrl = `${process.env.STRAPI_URL}/api`

/**
 * The default request headers.
 */
const defaultHeaders = {
  Authorization: `Bearer ${process.env.STRAPI_TOKEN}`,
}

/**
 * Request wrapper to apply defaults.
 */
export const request = async (path, options = {}) => {
  let fetchOptions = { next: { tags: [`strapi`] }, ...options }

  fetchOptions.headers = fetchOptions.hasOwnProperty(`headers`)
    ? { ...defaultHeaders, ...fetchOptions.headers }
    : { ...defaultHeaders }

  const response = await fetch(`${apiUrl}/${path}`, fetchOptions)

  return await response.json()
}

/**
 * GET request.
 */
export const get = async (path, params, options = {}) => {
  const query = params ? `?${qs.stringify(params)}` : ``
  return await request(`${path}${query}`, params, {
    ...options,
    method: `GET`,
  })
}

/**
 * Get by type:
 * Performs a query to fetch entries for a content type.
 * The default and maximum page size is 25 entries.
 */
export const getByType = async (contentType, params = {}) => {
  return await get(contentType, params)
}

/**
 * Get all by type:
 * Performs a recursive query to fetch all entries for a content type.
 * The query is limited to 10 pages to prevent an obscure amount of requests.
 * This should be used to get all entries without pagination.
 */
export const getAllByType = async (contentType, params = {}) => {
  const entries = []
  const maxPages = 10
  let currentPage = 1
  let morePages = true

  while (morePages === true && currentPage <= maxPages) {
    const query = await get(contentType, {
      ...params,
      pagination: {
        page: currentPage,
      },
    })

    if (query && (query?.data !== null || query.data.length > 0)) {
      for (const entry of query.data) {
        entries.push(entry)
      }

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
