import Fuse from "fuse.js/dist/fuse.basic.esm"

// Array of ZIP codes for resources that should be checked for city-level resources
import CITY_ZIPS from "./data/city-zips.json"
// Mapping of ZIP codes to arrays of ZIP codes they overlap for proximity search
import ZIP_MAP from "./data/zip-map.json"

export const getBasePath = ({ pathname, language }) => {
  if (pathname.startsWith(`/${language}/`)) {
    return pathname.slice(`/${language}`.length)
  }
  return pathname
}

export const objectFromSearchParams = (params) => {
  const obj = {}
  params.forEach((val, key) => {
    obj[key] = val
  })
  return obj
}

export const fromEntries = (iterable) => {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val
    return obj
  }, {})
}

export function injectScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script")
    script.src = src
    script.type = "text/javascript"
    script.async = true
    script.defer = true

    script.addEventListener("load", resolve, { once: true })
    script.addEventListener("error", reject, { once: true })

    document.body.appendChild(script)
  })
}

/* eslint-disable */
// Debounce function from underscore
export const debounce = (func, wait, immediate) => {
  let timeout
  return function () {
    const context = this
    const args = arguments
    const later = () => {
      timeout = null
      if (!immediate) func.apply(context, args)
    }
    const callNow = immediate && !timeout
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
    if (callNow) func.apply(context, args)
  }
}
/* eslint-enable */

// Based on https://gist.github.com/SimonJThompson/c9d01f0feeb95b18c7b0
function toRad(v) {
  return (v * Math.PI) / 180
}
function kmToMiles(km) {
  return (km * 0.62137).toFixed(2)
}

// Points are objects with the properties lat and lon
export function haversine([lon1, lat1], [lon2, lat2]) {
  const R = 6371 // km
  const x1 = lat2 - lat1
  const dLat = toRad(x1)
  const x2 = lon2 - lon1
  const dLon = toRad(x2)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const d = R * c
  return +kmToMiles(d)
}

const getRegionSortValue = (region) => {
  if (region.includes("Chicago") || region.includes("Suburbs")) return 0
  if (region.includes(" IL") || region.includes(" MO")) return 1
  if (region === "Statewide") return 2
  return 3
}

export const sortResults = (a, b) => {
  const prioritySort = (a.priority ? 0 : 1) - (b.priority ? 0 : 1)
  if (prioritySort !== 0) return prioritySort

  return getRegionSortValue(a.region || "") - getRegionSortValue(b.region || "")
}

// TODO: should this be based on where they're searching or the data?
const getRegionDistanceValue = (region) => {
  if (region.includes("Chicago") || region.includes("Suburbs")) return 5
  if (region.includes(" IL") || region.includes(" MO")) return 20
  return 30
}

export const loadQueryParamFilters = (location, filters) =>
  fromEntries(
    Object.entries(objectFromSearchParams(new URLSearchParams(location.search)))
      .filter(([key, value]) => value !== "" && key in filters)
      // Ignore non-numbers in initial ZIP query params
      .filter(([key, value]) => key !== `zip` || !!value.replace(/\D/g, ""))
      .map(([key, value]) =>
        Array.isArray(filters[key]) ? [key, value.split(",")] : [key, value]
      )
  )

export const getFiltersWithValues = (filters) =>
  fromEntries(
    Object.entries(filters).filter(
      ([, value]) =>
        !(Array.isArray(value) && value.length === 0) && value !== ``
    )
  )

export const applyFilters = ({ address, ...filters }, data) => {
  const filtered = data.filter((d) =>
    Object.entries(filters).every(([key, value]) => {
      // Ignore search, apply afterwards to save time
      if (key === `search`) {
        return true
      }
      if (key === `coords`) {
        const distanceInMiles = haversine(
          filters.coords.map((c) => +c),
          [d.longitude, d.latitude]
        )
        return distanceInMiles < getRegionDistanceValue(d.region || "")
      }
      if (key === `zip` && value.replace(/\D/g, ``) in ZIP_MAP) {
        const zipVal = value.replace(/\D/g, ``)
        // Filter out Neighborhood resources if ZIP filtered
        // Remove City resources if ZIP outside city
        return (
          !["City", "Neighborhood"].includes(d.level) ||
          (d.level === "City" && CITY_ZIPS.includes(zipVal)) ||
          (!!d[key] &&
            d.level === "Neighborhood" &&
            ZIP_MAP[zipVal].some((z) => d[key].includes(z)))
        )
      } else if (Array.isArray(value)) {
        // If data value is array, check for overlap
        return Array.isArray(d[key])
          ? d[key].some((v) => value.includes(v))
          : value.includes(d[key])
      } else if (typeof value === `string`) {
        return (d[key] || ``).toLowerCase().includes(value.toLowerCase().trim())
      }
      return true
    })
  )
  if (filters.search?.trim()) {
    return new Fuse(filtered, {
      minMatchCharLength: 3,
      shouldSort: true,
      threshold: 0.3,
      distance: 500,
      keys: [`name`, `description`, `descriptiones`, `what`],
    })
      .search(filters.search.trim())
      .map(({ item }) => item)
    // TODO: this conditional branch needed?
  } else if (!!filters.zip) {
    return filtered.sort(sortResults)
  } else {
    return filtered
  }
}
