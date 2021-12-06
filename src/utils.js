export const getBasePath = ({ pathname, language }) => {
  if (pathname.startsWith(`/${language}/`)) {
    return pathname.slice(`/${language}`.length)
  }
  return pathname
}

export const objectFromSearchParams = params => {
  const obj = {}
  params.forEach((val, key) => {
    obj[key] = val
  })
  return obj
}

export const fromEntries = iterable => {
  return [...iterable].reduce((obj, [key, val]) => {
    obj[key] = val
    return obj
  })
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
  return function() {
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
