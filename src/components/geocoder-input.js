import React, { useEffect, useState, useRef } from "react"
import PropTypes from "prop-types"
import { injectScript } from "../utils"

const GeocoderInput = ({
  name,
  id,
  label,
  placeholder,
  value,
  inputType,
  classNames,
  onChange,
  googleMapsApiKey,
}) => {
  const [didMount, setDidMount] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const geocoderRef = useRef(null)

  useEffect(() => {
    if (didMount) return

    injectScript(
      `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`
    ).then(() => setDidMount(true))
  }, [googleMapsApiKey])

  useEffect(() => {
    if (!didMount || !geocoderRef || !geocoderRef.current) return
    const autocomplete = new window.google.maps.places.Autocomplete(
      geocoderRef.current,
      {
        types: ["geocode"],
        bounds: {
          east: -87.494756,
          north: 42.508481,
          south: 36.970298,
          west: -91.513079,
        },
        strictBounds: true,
      }
    )
    autocomplete.setFields([
      "formatted_address",
      "address_components",
      "geometry",
    ])
    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      const address = place.formatted_address
      const { short_name: county } = place.address_components.find(
        ({ types }) => types.includes("administrative_area_level_2")
      )
      setLocalValue(address)
      onChange({
        address,
        county,
        lat: place.geometry.location.lat(),
        lon: place.geometry.location.lng(),
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [didMount, geocoderRef])

  useEffect(() => {
    setLocalValue(value)
  }, [value, onChange])

  return (
    <input
      name={name}
      id={id}
      value={localValue}
      ref={geocoderRef}
      aria-label={label || null}
      className={`input ${classNames}`}
      type={inputType}
      placeholder={placeholder}
      onChange={(e) => setLocalValue(e.target.value)}
    />
  )
}

GeocoderInput.propTypes = {
  name: PropTypes.string.isRequired,
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  inputType: PropTypes.string,
  classNames: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  googleMapsApiKey: PropTypes.string.isRequired,
}

GeocoderInput.defaultProps = {
  value: ``,
  placeholder: ``,
  inputType: `text`,
  classNames: ``,
}

export default GeocoderInput
