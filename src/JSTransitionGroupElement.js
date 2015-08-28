var React = require('react');

var JSTransitionGroupElement = React.createClass({
  propTypes: {
    key: React.PropTypes.string,
    element: React.PropTypes.node,
    onElementRemoved: React.PropTypes.func
  },

  componentWillUnmount() {
    if (this.props.onElementRemoved) {
      this.props.onElementRemoved(this.props.element);
    }
  },

  render() {
    return this.props.element;
  }
});

module.exports = JSTransitionGroupElement;
