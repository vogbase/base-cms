import React, { Component } from 'react';
import PropTypes from 'prop-types';
import gql from 'graphql-tag';
import Head from 'next/head';

// Routing
import { redirect } from '../routing';

// Utilities
import displayName from '../utils/component-display-name';
import sectionPath from '../utils/section-path';
import httpErrors from '../utils/http-errors';
import extractFragmentData from '../utils/extract-fragment-data';

// GraphQL
import defaultFragment from '../gql/fragments/with-website-section.graphql';

// HOCs
import withRequestOrigin from './withRequestOrigin';

// Components
import RelCanonical from '../components/RelCanonical';

/**
 * Builds the website section GraphQL query.
 */
export const buildQuery = ({ fragment }) => {
  const { spreadFragmentName, processedFragment } = extractFragmentData({ fragment });
  return gql`
    query WithWebsiteSection($input: WebsiteSectionAliasQueryInput!) {
      websiteSectionAlias(input: $input) {
        ...WithWebsiteSectionFragment
        ${spreadFragmentName}
      }
      websiteSectionRedirect(input: $input) {
        id
        alias
      }
    }
    ${defaultFragment}
    ${processedFragment}
  `;
};

export default (Page, options = {
  routePrefix: 'section',
  fragment: null,
}) => {
  class WithWebsiteSection extends Component {
    /**
     *
     */
    static async getInitialProps(ctx) {
      // Await the props of the Page
      let pageProps;
      if (Page.getInitialProps) {
        pageProps = await Page.getInitialProps(ctx);
      }

      const { fragment, routePrefix } = options;
      const { query, apollo, res } = ctx;
      // Get the section alias from the page query.
      // Note: the section alias is required for this HOC to function properly.
      const { alias } = query;
      if (!alias) {
        // No website alias was provided. Return a 404.
        throw httpErrors.notFound('No website section alias was provided.');
      }

      // Query for the website section using the alias, via the injected apollo client.
      const input = { alias };
      const variables = { input };
      const { data } = await apollo.query({ query: buildQuery({ fragment }), variables });
      const { websiteSectionAlias, websiteSectionRedirect } = data;

      if (websiteSectionAlias) {
        // The website section was found. Return it allong with the page props.
        const canonicalPath = sectionPath(alias, routePrefix);
        return { section: websiteSectionAlias, canonicalPath, ...pageProps };
      }

      if (websiteSectionRedirect && websiteSectionRedirect.alias) {
        // A redirect was found for this section alias. Force a redirect.
        const { alias: redirectAlias } = websiteSectionRedirect;
        const path = sectionPath(redirectAlias, routePrefix);
        redirect(res, path);
        return { section: {}, canonicalPath: path, ...pageProps };
      }

      // No website section or redirect was found for this alias. Return a 404.
      throw httpErrors.notFound(`No website section was found for alias '${alias}'`);
    }

    /**
     *
     */
    render() {
      const { requestOrigin, canonicalPath, section } = this.props;
      return (
        <>
          <Head>
            <title>{section.seoTitle}</title>
            <meta name="description" content={section.description} />
          </Head>
          <RelCanonical origin={requestOrigin} pathname={canonicalPath} />
          <Page {...this.props} />
        </>
      );
    }
  }
  WithWebsiteSection.displayName = `WithWebsiteSection(${displayName(Page)})`;
  WithWebsiteSection.propTypes = {
    ...Page.propTypes,
    canonicalPath: PropTypes.string.isRequired,
    section: PropTypes.shape({
      id: PropTypes.number.isRequired,
      alias: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      seoTitle: PropTypes.string,
    }).isRequired,
  };
  return withRequestOrigin(WithWebsiteSection);
};