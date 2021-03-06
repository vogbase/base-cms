const { get } = require('@base-cms/object-path');
const { asyncRoute, isFunction: isFn } = require('@base-cms/utils');
const { content: loader } = require('@base-cms/web-common/page-loaders');
const { blockContent: queryFactory } = require('@base-cms/web-common/query-factories');
const PageNode = require('./page-node');
const buildContentInput = require('../utils/build-content-input');
const applyQueryParams = require('../utils/apply-query-params');

module.exports = ({
  template,
  queryFragment,
  idResolver,
  redirectOnPathMismatch = true,
} = {}) => asyncRoute(async (req, res) => {
  const id = isFn(idResolver) ? await idResolver(req, res) : req.params.id;
  const { apollo, query } = req;

  const additionalInput = buildContentInput({ req });
  const content = await loader(apollo, { id, additionalInput });
  const { redirectTo } = content;
  const path = get(content, 'siteContext.path');
  if (redirectTo) {
    return res.redirect(301, applyQueryParams({ path: redirectTo, query }));
  }
  if (redirectOnPathMismatch && path !== req.path) {
    const pathTo = req.query['preview-mode'] ? `${path}?preview-mode=true` : path;
    return res.redirect(301, applyQueryParams({ path: pathTo, query }));
  }
  const pageNode = new PageNode(apollo, {
    queryFactory,
    queryFragment,
    variables: { input: { id: Number(id), ...additionalInput } },
    resultField: 'content',
  });
  return res.marko(template, { ...content, pageNode });
});
