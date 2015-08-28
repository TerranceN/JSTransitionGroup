'use strict';

var React = require('react');

var JSTransitionGroupElement = React.createClass({
  displayName: 'JSTransitionGroupElement',

  propTypes: {
    key: React.PropTypes.string,
    element: React.PropTypes.node,
    onElementRemoved: React.PropTypes.func
  },

  componentWillUnmount: function componentWillUnmount() {
    if (this.props.onElementRemoved) {
      this.props.onElementRemoved(this.props.element);
    }
  },

  render: function render() {
    return this.props.element;
  }
});

module.exports = JSTransitionGroupElement;