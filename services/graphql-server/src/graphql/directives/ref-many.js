const { SchemaDirectiveVisitor } = require('graphql-tools');
const { BaseDB } = require('@base-cms/db');
const formatStatus = require('../utils/format-status');
const convertOps = require('../utils/convert-ops');

const { isArray } = Array;

class RefManyDirective extends SchemaDirectiveVisitor {
  /**
   *
   * @param {*} field
   */
  visitFieldDefinition(field) {
    // eslint-disable-next-line no-param-reassign
    field.resolve = async (doc, { input = {} }, { basedb }) => {
      const {
        model,
        localField,
        foreignField,
        criteria,
      } = this.args;

      const fieldName = localField || field.name;
      const refs = BaseDB.get(doc, fieldName);
      const ids = BaseDB.extractRefIds(isArray(refs) ? refs : [refs]);
      // if (!ids.length) @todo Return an empty pagination instance.
      const {
        status,
        sort,
        pagination,
      } = input;
      const query = {
        ...convertOps(criteria),
        ...formatStatus(status),
        [foreignField]: { $in: ids },
      };

      console.log('@refMany', model, query);
      return basedb.paginate(model, { query, sort, ...pagination });
    };
  }
}

module.exports = RefManyDirective;
