# Education Justice Project Re-Entry Resource Guide

[![Build status](https://github.com/City-Bureau/chi-covid-resources/workflows/Deploy/badge.svg)](https://github.com/City-Bureau/chi-covid-resources/actions)

## Setup

You'll need [Node](https://nodejs.org/en/) installed and an [Airtable](https://airtable.com/) account set up with the fields in [`src/pages/index.js`](./src/pages/index.js).

### Reporting Resource Errors

If you want to use the functionality for reporting errors with resources, you'll need to deploy an AWS Lambda function using the [`serverless-airtable-button`](https://github.com/City-Bureau/serverless-airtable-button) repo. Alternatively you can replace the custom form modal with an Airtable embed using the `AirtableEmbedModal` component and setting the `prefill_Resource` param in the `queryParams` property to prefill the flagged resource.

### Internationalization

Multilingual support is provided through [`gatsby-plugin-intl`](https://github.com/wiziple/gatsby-plugin-intl). Translated phrases are located in JSON files in the [`src/intl/`](./src/intl/) directory, and translated Markdown pages are in [`src/markdown/static`](./src/markdown/static/).

Some of the content is specific to City Bureau, but the majority of the translated phrases are not. You can configure which languages are displayed by modifying the `languages` array in [`gatsby-config.js`](./gatsby-config.js).

### ZIP Code Search

To avoid the overhead and additional network requests of a geocoder, we're using a pre-generated mapping of ZIP codes to other ZIP codes they overlap to do a fuzzy ZIP search. You can update the mapping for your area by using our repo [City-Bureau/nearby-zip-map](https://github.com/City-Bureau/nearby-zip-map) to create a new file and replace the one in [`src/data/zip-map.json`](./src/data/zip-map.json).

Some of our resources are specific to the city of Chicago while others are available to the surrounding region. To make sure users searching ZIP codes outside of Chicago don't see Chicago resources, we're using a static list of city ZIP codes to determine whether resources are displayed when a ZIP code is searched. To replicate this for your area you can update the file [`src/data/city-zips.json`](./src/data/city-zips.json).

## Deploy

Currently deployed on Cloudflare Pages with a [deploy hook](https://developers.cloudflare.com/pages/platform/deploy-hooks) connected to an Airtable button script used to manually trigger deploys.
