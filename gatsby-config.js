require(`dotenv`).config()

const siteUrl = process.env.SITE_URL || `https://guide.reentryillinois.net`

const languages = [`en`, `es`]

module.exports = {
  siteMetadata: {
    title: `Illinois Reentry Resources`,
    siteUrl,
    author: `Education Justice Project`,
    twitterAuthor: ``,
    defaultLanguage: `en`,
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    reportErrorPath: process.env.REPORT_ERROR_PATH,
  },
  plugins: [
    { resolve: `gatsby-plugin-sass` },
    { resolve: `gatsby-plugin-react-helmet` },
    {
      resolve: `gatsby-plugin-react-intl`,
      options: {
        // language JSON resource path
        path: `${__dirname}/src/intl`,
        // supported language
        languages,
        // language file path
        defaultLanguage: `en`,
        redirect: true,
        redirectComponent: require.resolve(`./src/components/redirect.js`),
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `markdown`,
        path: `${__dirname}/src/markdown`,
      },
    },
    { resolve: `gatsby-transformer-sharp` },
    { resolve: `gatsby-transformer-remark` },
    { resolve: `gatsby-plugin-sharp` },
    // {
    //   resolve: `gatsby-plugin-web-font-loader`,
    //   options: {
    //     typekit: {
    //       id: `pbz7tnn`,
    //     },
    //   },
    // },
    // {
    //   resolve: `gatsby-plugin-google-gtag`,
    //   options: {
    //     trackingIds: [`UA-68381272-7`],
    //     gtagConfig: {
    //       anonymize_ip: true,
    //     },
    //     pluginConfig: {
    //       respectDNT: true,
    //     },
    //   },
    // },
    {
      resolve: `gatsby-source-airtable`,
      options: {
        apiKey: process.env.AIRTABLE_KEY,
        tables: [
          {
            baseId: process.env.AIRTABLE_BASE,
            tableName: process.env.AIRTABLE_TABLE,
            tableView: process.env.AIRTABLE_VIEW,
            queryName: `resources`,
          },
        ],
      },
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Illinois Reentry Resource Guide`,
        short_name: `Reentry Resources`,
        start_url: `/`,
        background_color: `#ffffff`,
        theme_color: `#ffffff`,
        display: `minimal-ui`,
        icon: `src/images/icon.png`,
      },
    },
    // {
    //   resolve: `gatsby-plugin-sitemap`,
    //   options: {
    //     exclude: [`/embed*`, `/about`],
    //     query: `
    //     {
    //       site {
    //         siteMetadata {
    //           siteUrl
    //         }
    //       }

    //       allSitePage(filter: {context: {intl: {routed: {eq: false}}}}) {
    //         edges {
    //           node {
    //             path
    //           }
    //         }
    //       }
    //     }
    //     `,
    //     serialize: ({
    //       site: {
    //         siteMetadata: { siteUrl },
    //       },
    //       allSitePage,
    //     }) =>
    //       allSitePage.edges.map(({ node: { path } }) => ({
    //         url: `${siteUrl}/en${path}`,
    //         changefreq: `daily`,
    //         priority: path === `/` ? 1.0 : 0.7,
    //         links: languages
    //           .filter((lang) => lang !== `en`)
    //           .map((lang) => ({ lang, url: `${siteUrl}/${lang}${path}` })),
    //       })),
    //   },
    // },
    // `gatsby-plugin-offline`,
  ],
}
