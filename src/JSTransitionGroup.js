var React = require('react');
var JSTransitionGroupElement = require('./JSTransitionGroupElement.js');

var cx = require('classnames');

var animLoop;

var transitionGroups = [];

var requestAnimationFrame = function(callback, delay = 0) {
  if (typeof window.requestAnimationFrame !== 'undefined') {
    window.requestAnimationFrame(callback);
  } else {
    setTimeout(callback, delay);
  }
}

var animFunction = function() {
  for (var i = 0; i < transitionGroups.length; i++) {
    transitionGroups[i].update();
  }

  animLoop = requestAnimationFrame(animFunction, 100);
};

var JSTransitionGroup = React.createClass({
  propTypes: {
    animData: React.PropTypes.object.isRequired
  },

  getInitialState() {
    return {
      animState: {}
    };
  },

  componentDidMount() {
    if (!animLoop) {
      animLoop = requestAnimationFrame(animFunction);
    }

    transitionGroups.push(this);
  },

  componentWillUnmount() {
    transitionGroups.splice(transitionGroups.indexOf(this));

    if (transitionGroups.length === 0) {
      clearTimeout(animLoop);
      animLoop = null;
    }
  },

  getInitialAnimationState(index) {
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

  changeState(key, newState, addParams) {
    if (key in this.state.animState && this.state.animState[key].targetState !== 'leave') {
      if (key in this.state.animState) {
        var newAnimState = {};
        newAnimState[key] = Object.assign(this.state.animState[key], Object.assign({
          style: this.getAnimState(key),
          lastState: this.state.animState[key].targetState,
          duration: this.props.animData[newState].duration,
          targetState: newState,
          startTime: new Date(),
          targetStyle: this.props.animData[newState].style
        }, addParams || {}));
        this.setState({
          animState: Object.assign(this.state.animState, newAnimState)
        });
      }
    }
  },

  update() {
    var newAnimState = {};

    var decrIndex = 0;

    var sortedKeys = Object.keys(this.state.animState).sort((a, b) => {
      if (this.state.animState[a].index < this.state.animState[b].index) {
        return -1;
      } else {
        return 1;
      }
    });

    sortedKeys.forEach(key => {
      if (this.state.animState[key].targetState !== 'leave') {
        newAnimState[key] = this.state.animState[key];
        newAnimState[key].index -= decrIndex;
      } else {
        if (new Date() - this.state.animState[key].startTime < this.state.animState[key].duration) {
          newAnimState[key] = this.state.animState[key];
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
    React.Children.forEach(this.props.children, elem => childrenList.push(elem));
    childrenList.forEach(elem => {
      var key = elem.key;
      if (!(key in this.state.animState)) {
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
        if ('enter' in this.props.animData) {
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
    Object.keys(newAnimState).forEach(key => {
      var incr = 0;
      Object.keys(increments).forEach(incrKey => {
        if (increments[incrKey] <= newAnimState[key].index) {
          numIncr += 1;
          incr += 1;
        }
      });
      newAnimState[key].index += incr;
    });

    Object.keys(newAnimKeys).forEach(index => {
      newAnimKeys[index].forEach((key, i) => {
        newAnimState[key] = this.getInitialAnimationState(parseInt(index) + i);
      });
    });

    this.setState({
      animState: newAnimState
    });

    this.forceUpdate();
  },

  onElementRemoved(element) {
    var key = element.key;
    this.changeState(key, 'leave', {
      element: element
    });
  },

  interpStyles(s1, s2, i) {
    var result = {};
    for (var key in s1) {
      if (key in s2) {
        result[key] = s1[key] + (s2[key] - s1[key]) * i;
      }
    }
    return result;
  },

  getAnimState(key) {
    var state = this.state.animState[key];
    var t = new Date() - state.startTime;
    var i = 0.5 * (Math.cos(Math.PI + Math.PI * Math.min(1, t / state.duration)) + 1);
    return this.interpStyles(state.style, state.targetStyle, i);
  },

  getStyle(key) {
    if (key in this.state.animState) {
      return this.getAnimState(key);
    } else if ('enter' in this.props.animData) {
      return this.props.animData['enter'].style;
    } else {
      return {};
    }
  },

  renderChild(key, oldElem) {
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
    return (
      <JSTransitionGroupElement
        key={key}
        element={elem}
        onElementRemoved={this.onElementRemoved}
        />
    );
  },

  render() {
    var renderedChildren = {};

    var children = [];

    React.Children.forEach(this.props.children, element => {
      var key = element.key;
      renderedChildren[key] = true;
      children.push(this.renderChild(key, element));
    });

    Object.keys(this.state.animState).forEach(key => {
      if (key in this.state.animState) {
        var state = this.state.animState[key];
        if (!(key in renderedChildren) && state.element) {
          var child = this.renderChild(key, this.state.animState[key].element);
          if (state.index < children.length) {
            children.splice(state.index, 0, child);
          } else {
            children.push(child);
          }
        }
      }
    });
    return (
      <div {...this.props}>
        {children}
      </div>
    );
  }
});

module.exports = JSTransitionGroup;
