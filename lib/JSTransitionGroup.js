'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react');
var JSTransitionGroupElement = require('./JSTransitionGroupElement.js');

var cx = require('classnames');

var animLoop;

var transitionGroups = [];

console.log('load');

var requestAnimationFrame = function requestAnimationFrame(callback) {
  var delay = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];

  if (typeof window.requestAnimationFrame !== 'undefined') {
    window.requestAnimationFrame(callback);
  } else {
    setTimeout(callback, delay);
  }
};

var animFunction = function animFunction() {
  console.log('anim');
  for (var i = 0; i < transitionGroups.length; i++) {
    transitionGroups[i].update();
  }

  animLoop = requestAnimationFrame(animFunction, 100);
};

var JSTransitionGroup = React.createClass({
  displayName: 'JSTransitionGroup',

  propTypes: {
    animData: React.PropTypes.object.isRequired
  },

  getInitialState: function getInitialState() {
    return {
      animState: {}
    };
  },

  componentDidMount: function componentDidMount() {
    if (!animLoop) {
      animLoop = requestAnimationFrame(animFunction);
    }

    transitionGroups.push(this);
  },

  componentWillUnmount: function componentWillUnmount() {
    transitionGroups.splice(transitionGroups.indexOf(this));

    if (transitionGroups.length === 0) {
      clearTimeout(animLoop);
      animLoop = null;
    }
  },

  getInitialAnimationState: function getInitialAnimationState(index) {
    return {
      lastState: 'enter',
      targetState: 'default',
      duration: this.props.animData['enter'].duration,
      startTime: new Date(),
      style: this.props.animData['enter'].style,
      targetStyle: this.props.animData['default'].style,
      element: null,
      index: index
    };
  },

  changeState: function changeState(key, newState, addParams) {
    if (key in this.state.animState && this.state.animState[key].targetState !== 'leave') {
      if (key in this.state.animState) {
        var newAnimState = {};
        newAnimState[key] = _extends(this.state.animState[key], _extends({
          style: this.getAnimState(key),
          lastState: this.state.animState[key].targetState,
          duration: this.props.animData[newState].duration,
          targetState: newState,
          startTime: new Date(),
          targetStyle: this.props.animData[newState].style
        }, addParams || {}));
        this.setState({
          animState: _extends(this.state.animState, newAnimState)
        });
      }
    }
  },

  update: function update() {
    var _this = this;

    var newAnimState = {};

    var decrIndex = 0;

    var sortedKeys = Object.keys(this.state.animState).sort(function (a, b) {
      if (_this.state.animState[a].index < _this.state.animState[b].index) {
        return -1;
      } else {
        return 1;
      }
    });

    sortedKeys.forEach(function (key) {
      if (_this.state.animState[key].targetState !== 'leave') {
        newAnimState[key] = _this.state.animState[key];
        newAnimState[key].index -= decrIndex;
      } else {
        if (new Date() - _this.state.animState[key].startTime < _this.state.animState[key].duration) {
          newAnimState[key] = _this.state.animState[key];
          newAnimState[key].index -= decrIndex;
        } else {
          decrIndex += 1;
        }
      }
    });

    var increments = {};
    var lastElem;

    var newAnimKeys = {};

    var childrenList = [];
    React.Children.forEach(this.props.children, function (elem) {
      return childrenList.push(elem);
    });
    childrenList.forEach(function (elem) {
      var key = elem.key;
      if (!(key in _this.state.animState)) {
        var index;
        if (lastElem) {
          if (lastElem.key in newAnimState) {
            index = newAnimState[lastElem.key].index + 1;
          } else {
            index = increments[lastElem.key] + 1;
          }
        } else {
          index = 0;
        }
        if ('enter' in _this.props.animData) {
          if (index in newAnimKeys) {
            newAnimKeys[index].push(key);
          } else {
            newAnimKeys[index] = [key];
          }
        }
        increments[key] = index;
      }
      lastElem = elem;
    });

    var numIncr = 0;
    Object.keys(newAnimState).forEach(function (key) {
      var incr = 0;
      Object.keys(increments).forEach(function (incrKey) {
        if (increments[incrKey] <= newAnimState[key].index) {
          numIncr += 1;
          incr += 1;
        }
      });
      newAnimState[key].index += incr;
    });

    Object.keys(newAnimKeys).forEach(function (index) {
      newAnimKeys[index].forEach(function (key, i) {
        newAnimState[key] = _this.getInitialAnimationState(parseInt(index) + i);
      });
    });

    this.setState({
      animState: newAnimState
    });

    this.forceUpdate();
  },

  onElementRemoved: function onElementRemoved(element) {
    var key = element.key;
    this.changeState(key, 'leave', {
      element: element
    });
  },

  interpStyles: function interpStyles(s1, s2, i) {
    var result = {};
    for (var key in s1) {
      if (key in s2) {
        result[key] = s1[key] + (s2[key] - s1[key]) * i;
      }
    }
    return result;
  },

  getAnimState: function getAnimState(key) {
    var state = this.state.animState[key];
    var t = new Date() - state.startTime;
    var i = 0.5 * (Math.cos(Math.PI + Math.PI * Math.min(1, t / state.duration)) + 1);
    return this.interpStyles(state.style, state.targetStyle, i);
  },

  getStyle: function getStyle(key) {
    if (key in this.state.animState) {
      return this.getAnimState(key);
    } else if ('enter' in this.props.animData) {
      return this.props.animData['enter'].style;
    } else {
      return {};
    }
  },

  renderChild: function renderChild(key, oldElem) {
    var extraClasses = {};
    if (key in this.state.animState) {
      if (this.state.animState[key].lastState) {
        extraClasses['lastState-' + this.state.animState[key].lastState] = true;
      }
      if (this.state.animState[key].targetState) {
        extraClasses['targetState-' + this.state.animState[key].targetState] = true;
      }
    }
    var elem = React.cloneElement(oldElem, {
      style: this.getStyle(key),
      className: cx(oldElem.props.className, extraClasses)
    });
    if (this.state.animState[key]) {
      return React.createElement(JSTransitionGroupElement, {
        key: key,
        element: elem,
        onElementRemoved: this.onElementRemoved
      });
    } else {
      return null;
    }
  },

  render: function render() {
    var _this2 = this;

    var renderedChildren = {};

    var children = [];

    React.Children.forEach(this.props.children, function (element) {
      var key = element.key;
      renderedChildren[key] = true;
      children.push(_this2.renderChild(key, element));
    });

    Object.keys(this.state.animState).forEach(function (key) {
      if (key in _this2.state.animState) {
        var state = _this2.state.animState[key];
        if (!(key in renderedChildren) && state.element) {
          var child = _this2.renderChild(key, _this2.state.animState[key].element);
          if (state.index < children.length) {
            children.splice(state.index, 0, child);
          } else {
            children.push(child);
          }
        }
      }
    });
    return React.createElement(
      'div',
      this.props,
      children
    );
  }
});