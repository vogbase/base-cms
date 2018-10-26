import React from 'react';
import PropTypes from 'prop-types';
import { isFunction as isFn } from '../../../utils';

const displayName = 'Core/Elements/Value';

const propTypes = {
  children: PropTypes.func,
  collapsible: PropTypes.bool,
  tag: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  value: PropTypes.node,
};

const defaultProps = {
  children: v => v,
  collapsible: true,
  tag: 'div',
  value: null,
};

const ValueElement = ({
  children,
  collapsible,
  tag: Tag,
  value,
  ...attrs
}) => {
  // Protect the child render function.
  const render = isFn(children) ? children : defaultProps.children;
  // Wrap the value with the element and return (if not collapsible).
  return !value && collapsible ? null : <Tag {...attrs}>{render(value)}</Tag>;
};

ValueElement.displayName = displayName;
ValueElement.propTypes = propTypes;
ValueElement.defaultProps = defaultProps;

export default ValueElement;
