import React from "react"
import { injectIntl } from "gatsby-plugin-react-intl"
import SEO from "./seo"

const Redirect = ({ intl }) => (
  <SEO
    title={intl.formatMessage({ id: "meta-title" })}
    overrideTitle
    lang={intl.locale}
  />
)

export default injectIntl(Redirect)
