import Fuse from "fuse.js/dist/fuse.basic.esm"

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

const getLocationDistanceValue = ({ address, county }) => {
  if ((address || "").includes("Chicago, ")) return 5
  if (county === "Cook County") return 20
  return 30
}

export const sortResults = (a, b) => {
  const prioritySort = (a.priority ? 0 : 1) - (b.priority ? 0 : 1)
  if (prioritySort !== 0) return prioritySort

  return getRegionSortValue(a.region || "") - getRegionSortValue(b.region || "")
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

export const applyFilters = ({ address, county, ...filters }, data) => {
  const distanceThreshold = getLocationDistanceValue({ address, county })
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
        // Allow statewide and national resources when location searched
        return (
          distanceInMiles < distanceThreshold ||
          (d.region || []).some((region) =>
            ["Statewide", "Nationwide"].includes(region)
          )
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
  } else {
    return filtered.sort(sortResults)
  }
}
