import React, { useMemo, useEffect, useState } from "react"
import PropTypes from "prop-types"
import { graphql } from "gatsby"
import { useIntl } from "gatsby-plugin-intl"
import fromEntries from "object.fromentries"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import Fuse from "fuse.js"

import Layout from "../components/layout"
import SEO from "../components/seo"
import FilterDescription from "../components/filter-description"
import ResourceRow from "../components/resource-row"
import CheckboxGroup from "../components/checkbox-group"
import DebouncedInput from "../components/debounced-input"
import GeocoderInput from "../components/geocoder-input"
import ScrollTopButton from "../components/scroll-top-button"
import ToastMessage from "../components/toast-message"
import ReportErrorModal from "../components/report-error-modal"

import { objectFromSearchParams, haversine } from "../utils"
import { useDebounce } from "../hooks"
import { DEFAULT_DEBOUNCE } from "../constants"
// Array of ZIP codes for resources that should be checked for city-level resources
import CITY_ZIPS from "../data/city-zips.json"
// Mapping of ZIP codes to arrays of ZIP codes they overlap for proximity search
import ZIP_MAP from "../data/zip-map.json"

export const PAGE_SIZE = 10

export const LEVEL_ENUM = {
  State: 1,
  County: 2,
  City: 3,
  Neighborhood: 4,
  National: 5,
}
const ZIP_LEVEL_ENUM = {
  Neighborhood: 1,
  City: 2,
  County: 3,
  State: 4,
  National: 5,
}

export const sortByLevel = levelEnum => (a, b) => {
  // Sort first by level, but if that's equal prioritize resources without restrictions
  const levelSort = (levelEnum[a.level] || 10) - (levelEnum[b.level] || 10)
  return levelSort === 0
    ? (a.who || []).length - (b.who || []).length
    : levelSort
}

export const getFiltersWithValues = filters =>
  fromEntries(
    Object.entries(filters).filter(
      ([key, value]) =>
        !(Array.isArray(value) && value.length === 0) && value !== ``
    )
  )

export const applyFilters = (filters, data) => {
  const filterEntries = Object.entries(filters).filter(f => f[0] !== "address")
  const filtered = data.filter(d =>
    filterEntries.every(([key, value]) => {
      // Ignore search, apply afterwards to save time
      if (key === `search`) {
        return true
      }
      if (key === `coords`) {
        // TODO: Check type of location, base distance filter on that
        const distanceInMiles = haversine(
          filters.coords.map(c => +c),
          [d.longitude, d.latitude]
        )
        return distanceInMiles < 2
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
            ZIP_MAP[zipVal].some(z => d[key].includes(z)))
        )
      } else if (Array.isArray(value)) {
        // If data value is array, check for overlap
        return Array.isArray(d[key])
          ? d[key].some(v => value.includes(v))
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
  } else if (!!filters.zip) {
    return filtered.sort(sortByLevel(ZIP_LEVEL_ENUM))
  } else {
    return filtered
  }
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

const updateQueryParams = (filters, removeKeys) => {
  // Retain query params not included in the params we're updating
  const initParams = fromEntries(
    Object.entries(
      objectFromSearchParams(new URLSearchParams(window.location.search))
    ).filter(([key, _]) => !removeKeys.includes(key))
  )
  // Merge the existing, unwatched params with the filter params
  const params = new URLSearchParams({
    ...initParams,
    ...filters,
  })
  const suffix = params.toString() === `` ? `` : `?${params}`
  window.history.replaceState(
    {},
    window.document.title,
    `${window.location.protocol}//${window.location.host}${window.location.pathname}${suffix}`
  )
  // Fire a custom event so that other components can update params
  const event = new CustomEvent("location-search-change")
  document.dispatchEvent(event)
}

const sendGaQueryParams = ({ search, what, zip }) => {
  const filters = [what, zip]
    .reduce((acc, val) => acc.concat(val), [])
    .filter(v => !!v)
  if (
    typeof window !== "undefined" &&
    window.gtag &&
    !window.location.host.includes("staging") &&
    window.location.search
  ) {
    if (search && search.trim()) {
      window.gtag("event", "search", {
        event_category: window.location.pathname,
        event_label: search.trim(),
      })
    }
    if (filters.length > 0) {
      window.gtag("event", "filter", {
        event_category: window.location.pathname,
        event_label: filters.join(", "),
      })
    }
  } else {
    console.log(search, filters)
  }
}

const sendGaNextPage = page => {
  if (
    page > 1 &&
    typeof window !== "undefined" &&
    window.gtag &&
    !window.location.host.includes("staging")
  ) {
    window.gtag("event", "page", {
      event_category: window.location.pathname,
      event_label: page,
    })
  } else if (page > 1) {
    console.log(page)
  }
}

const IndexPage = ({
  location,
  data: {
    site: {
      siteMetadata: { reportErrorPath, googleMapsApiKey },
    },
    allAirtable: { whatOptions, edges },
  },
}) => {
  const defaultFilters = {
    search: ``,
    address: ``,
    coords: [],
    what: [],
  }
  const allResults = useMemo(
    () =>
      edges
        .map(({ node: { recordId, data } }) => ({
          id: recordId,
          ...data,
        }))
        .sort(sortByLevel(LEVEL_ENUM)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const [filters, setFilters] = useState(defaultFilters)
  const debounceFilters = useDebounce(filters, DEFAULT_DEBOUNCE)
  const results = useMemo(
    () => applyFilters(getFiltersWithValues(debounceFilters), allResults),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      debounceFilters.search,
      debounceFilters.what,
      debounceFilters.address,
      debounceFilters.coords,
    ]
  )
  const [expanded, setExpanded] = useState(false)
  const [page, setPage] = useState(1)
  const [flagId, setFlagId] = useState(``)
  const [toast, setToast] = useState(``)
  const intl = useIntl()

  const translateOptions = options =>
    options.map(value => ({ value, label: intl.formatMessage({ id: value }) }))

  useEffect(() => {
    // Set initial filters from URL params if present
    // Moved out of initial state to avoid hydration bugs
    // https://stackoverflow.com/a/59653180
    const urlFilters = loadQueryParamFilters(location, defaultFilters)
    if (Object.keys(getFiltersWithValues(urlFilters)).length) {
      setFilters(urlFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    updateQueryParams(getFiltersWithValues(debounceFilters), [
      `search`,
      `address`,
      `coords`,
      `what`,
      // `who`,
    ])
    sendGaQueryParams(debounceFilters)
    if (page !== 1) setPage(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debounceFilters.search,
    debounceFilters.coords,
    debounceFilters.what,
    // debounceFilters.who,
  ])

  useEffect(() => {
    sendGaNextPage(page)
  }, [page])

  return (
    <Layout location={location}>
      <SEO
        title={`${intl.formatMessage({
          id: "meta-title",
        })} | ${intl.formatMessage({ id: "city-bureau" })}`}
        overrideTitle
        lang={intl.locale}
      />
      {flagId && (
        <ReportErrorModal
          reportErrorPath={reportErrorPath}
          id={flagId}
          onSuccess={() =>
            setToast(intl.formatMessage({ id: "flag-resource-success" }))
          }
          onClose={() => setFlagId(``)}
        />
      )}
      <ToastMessage show={toast !== ``} onHide={() => setToast(``)}>
        {toast}
      </ToastMessage>
      <main className="main filter-container">
        <aside className="section filter-controls">
          <div className="filter-header">
            <h1 className="header">
              {intl.formatMessage({ id: "filter-title" })}
            </h1>
            <button
              type="button"
              className="is-hidden-tablet is-primary button"
              aria-haspopup="true"
              aria-expanded={expanded.toString()}
              aria-controls="filter-form"
              onClick={() => setExpanded(!expanded)}
            >
              <FontAwesomeIcon icon="filter" />
              &nbsp;
              {intl.formatMessage({
                id: expanded ? "hide-filters" : "show-filters",
              })}
            </button>
          </div>
          <form
            id="filter-form"
            className={expanded ? `` : `is-hidden-mobile`}
            method="GET"
            name="filter"
            role="search"
            action=""
          >
            <div className="filter-group search">
              <DebouncedInput
                name="search"
                id="search"
                classNames="search"
                inputType="search"
                value={filters.search}
                label={intl.formatMessage({ id: "search-label" })}
                placeholder={intl.formatMessage({ id: "search-label" })}
                onChange={search => setFilters({ ...filters, search })}
              />
              <FontAwesomeIcon icon="search" />
            </div>
            <div className="filter-group">
              <label className="label" htmlFor="address-search">
                {intl.formatMessage({ id: "where-label" })}
              </label>
              <GeocoderInput
                id="address-search"
                name="address"
                value={filters.address}
                placeholder={intl.formatMessage({ id: "address-placeholder" })}
                googleMapsApiKey={googleMapsApiKey}
                onChange={({ address, lat, lon }) =>
                  setFilters({ ...filters, address, coords: [lon, lat] })
                }
              />
            </div>
            <CheckboxGroup
              name="what"
              label={intl.formatMessage({ id: "what-label" })}
              options={translateOptions(whatOptions)}
              value={filters.what}
              onChange={what => setFilters({ ...filters, what })}
              classNames="filter-group"
            />
            {/* <CheckboxGroup
              name="who"
              label={intl.formatMessage({ id: "who-label" })}
              help={intl.formatMessage({ id: "who-help" })}
              options={translateOptions(whoOptions)}
              value={filters.who}
              onChange={who => setFilters({ ...filters, who })}
              classNames="filter-group"
            /> */}
            <button
              className={`button is-info clear-filters ${
                Object.entries(getFiltersWithValues(debounceFilters)).length ===
                0
                  ? `is-hidden`
                  : ``
              }`}
              type="button"
              onClick={() => setFilters(defaultFilters)}
            >
              {intl.formatMessage({ id: "clear-filters" })}
            </button>
          </form>
          <ScrollTopButton />
        </aside>
        <div className="section filter-results-section">
          <FilterDescription
            filters={getFiltersWithValues(debounceFilters)}
            count={results.length}
          />
          <div className="filter-results">
            {results.slice(0, page * PAGE_SIZE).map(result => (
              <ResourceRow
                key={result.id}
                onFlag={() => setFlagId(result.id)}
                {...result}
              />
            ))}
          </div>
          <div className="filter-results-footer">
            {results.length > PAGE_SIZE * page ? (
              <button
                type="button"
                className="button is-primary"
                onClick={() => setPage(page + 1)}
              >
                {intl.formatMessage({ id: "load-more-results" })}
              </button>
            ) : (
              ``
            )}
          </div>
        </div>
      </main>
    </Layout>
  )
}

IndexPage.propTypes = {
  location: PropTypes.object.isRequired,
  data: PropTypes.object.isRequired,
}

// TODO: Re-add email, hours, description_es, qualifications, level, languages
export const query = graphql`
  query {
    site {
      siteMetadata {
        googleMapsApiKey
        reportErrorPath
      }
    }
    allAirtable {
      whatOptions: distinct(field: data___Primary_Category_ies)
      edges {
        node {
          recordId
          data {
            name: Name
            link: Link
            phone: Phone
            address: Address
            zip: ZIP
            description: Description
            what: Primary_Category_ies
            lastUpdated: Last_Updated
            latitude: Latitude
            longitude: Longitude
          }
        }
      }
    }
  }
`

export default IndexPage
