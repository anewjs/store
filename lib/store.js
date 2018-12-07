function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { createSelector } from 'reselect';

var Store =
/*#__PURE__*/
function () {
  function Store(options) {
    var _this = this;

    _defineProperty(this, "subscribe", function (listener) {
      if (typeof listener !== 'function') {
        throw new Error('Expected the listener to be a function.');
      }

      var isSubscribed = true;

      _this._ensureCanMutateNextListeners();

      _this._nextListeners.push(listener);

      return function unsubscribe() {
        if (!isSubscribed) {
          return;
        }

        isSubscribed = false;

        this._ensureCanMutateNextListeners();

        var index = this._nextListeners.indexOf(listener);

        this._nextListeners.splice(index, 1);
      };
    });

    _defineProperty(this, "get", function () {
      return _this.state;
    });

    _defineProperty(this, "dispatch", function (actionPath) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      var actionPaths = actionPath.split('/');
      var lastActionIndex = actionPaths.length - 1;
      return actionPaths.reduce(function (actionParent, path, i) {
        if (i === lastActionIndex) {
          var action = actionParent[path];
          return typeof action === 'function' && action.apply(void 0, args);
        }

        return actionParent[path];
      }, _this.dispatch);
    });

    _defineProperty(this, "commit", function (reducerPath) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      var reducerPaths = reducerPath.split('/');
      var lastReducerIndex = reducerPaths.length - 1;
      return reducerPaths.reduce(function (reducerParent, path, i) {
        if (i === lastReducerIndex) {
          var reducer = reducerParent[path];
          return typeof reducer === 'function' && reducer.apply(void 0, args);
        }

        return reducerParent[path];
      }, _this.commit);
    });

    _defineProperty(this, "stage", function () {
      _this.isStaging = true;

      _this.on.commit('@anew/STAGE_START');
    });

    _defineProperty(this, "_stageCommit", function () {
      _this.isStaging = false;

      _this.on.commit('@anew/STAGE_COMPLETE');

      _this._notifiyListeners();
    });

    _defineProperty(this, "_ensureCanMutateNextListeners", function () {
      if (_this._nextListeners === _this._listeners) {
        _this._nextListeners = _this._listeners.slice();
      }
    });

    _defineProperty(this, "_notifiyListeners", function () {
      if (!_this.isStaging) {
        var listeners = _this._listeners = _this._nextListeners;
        listeners.forEach(function (listener) {
          return listener();
        });
      }
    });

    _defineProperty(this, "_callPathInSiblingReducers", function (reducers, path, state, parentState) {
      for (var _len3 = arguments.length, args = new Array(_len3 > 4 ? _len3 - 4 : 0), _key3 = 4; _key3 < _len3; _key3++) {
        args[_key3 - 4] = arguments[_key3];
      }

      var paths = path.split('/');

      if (paths.length === 2) {
        var targetStoreName = paths[0];
        var targetReducerName = paths[1];
        Object.entries(reducers).forEach(function (_ref) {
          var reducerName = _ref[0],
              reducer = _ref[1];

          if (reducer.on) {
            var targetStore = reducer.on[targetStoreName];
            var targetReducer = targetStore && targetStore[targetReducerName];

            if (typeof targetReducer === 'function') {
              _this._updateState(parentState[reducerName], targetReducer.apply(void 0, [parentState[reducerName], state].concat(args)));
            }
          }
        });
      }
    });

    _defineProperty(this, "_updateState", function (state, change, stateKey) {
      if (change && change !== state) {
        if (stateKey) {
          _this.on.update(state[stateKey]);

          if (typeof state[stateKey] === 'object') {
            return state[stateKey] = Object.assign(state[stateKey], change);
          } else {
            return state[stateKey] = change;
          }
        } else {
          _this.on.update(state);

          if (typeof state === 'object') {
            return state = Object.assign(state, change);
          } else {
            return state = change;
          }
        }
      }

      return state;
    });

    if (options) {
      this.use(options);
    }
  }

  var _proto = Store.prototype;

  _proto.use = function use(_temp) {
    var _ref2 = _temp === void 0 ? {} : _temp,
        _ref2$state = _ref2.state,
        state = _ref2$state === void 0 ? this.state || {} : _ref2$state,
        _ref2$reducers = _ref2.reducers,
        reducers = _ref2$reducers === void 0 ? this.reducers || {} : _ref2$reducers,
        _ref2$actions = _ref2.actions,
        actions = _ref2$actions === void 0 ? this.actions || {} : _ref2$actions,
        _ref2$getters = _ref2.getters,
        getters = _ref2$getters === void 0 ? this.getters || {} : _ref2$getters,
        _ref2$selectors = _ref2.selectors,
        selectors = _ref2$selectors === void 0 ? this.selectors || {} : _ref2$selectors,
        _ref2$on = _ref2.on,
        on = _ref2$on === void 0 ? this.on || {} : _ref2$on,
        _ref2$modules = _ref2.modules,
        modules = _ref2$modules === void 0 ? this.modules : _ref2$modules;

    // Nested Default
    if (!on.dispatch) on.dispatch = function () {
      return null;
    };
    if (!on.commit) on.commit = function () {
      return null;
    };
    if (!on.update) on.update = function () {
      return null;
    }; // Assign Options

    this.state = state;
    this.reducers = reducers;
    this.actions = actions;
    this.getters = getters;
    this.selectors = selectors;
    this.on = on;
    this.modules = modules; // Initialize Listeners

    this._listeners = [];
    this._nextListeners = this._listeners; // Initialize Store

    this._initStore(); // Install Options (From, To, ..args)


    this._installModules(modules, this);

    this._installGetters(getters, this.get, this.get);

    this._installSelectors(selectors, this.select, this);

    this._installReducers(reducers, this.commit, {}, this.state, {}, this.get);

    this._installActions(actions, this.dispatch, this);
  };

  _proto._initStore = function _initStore() {
    this.select = {};
    this.stage.commit = this._stageCommit;
  };

  _proto._installModules = function _installModules(modules, storage) {
    var _this2 = this;

    if (modules === void 0) {
      modules = {};
    }

    Object.entries(modules).forEach(function (_ref3) {
      var moduleName = _ref3[0],
          module = _ref3[1];
      if (module.state === undefined) module.state = {};
      Object.keys(module).forEach(function (type) {
        switch (type) {
          case 'modules':
            _this2._installModules(module.modules, module);

            break;

          default:
            storage[type][moduleName] = module[type];
            break;
        }
      });
    });
  };

  _proto._installGetters = function _installGetters(getters, storage, getState) {
    var _this3 = this;

    Object.entries(getters).forEach(function (_ref4) {
      var getName = _ref4[0],
          get = _ref4[1];

      switch (typeof get) {
        case 'function':
          storage[getName] = function () {
            for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
              args[_key4] = arguments[_key4];
            }

            return get.apply(void 0, [getState()].concat(args));
          };

          break;

        case 'object':
          storage[getName] = function () {
            return getState()[getName];
          };

          _this3._installGetters(get, storage[getName], storage[getName]);

          break;
      }
    });
  };

  _proto._installSelectors = function _installSelectors(selectors, storage, store) {
    var _this4 = this;

    Object.entries(selectors).forEach(function (_ref5) {
      var selectorName = _ref5[0],
          selector = _ref5[1];

      switch (typeof selector) {
        case 'function':
          var memoizedSelector = createSelector.apply(void 0, selector(store));

          storage[selectorName] = function () {
            return memoizedSelector(store.get());
          };

          break;

        case 'object':
          storage[selectorName] = {};

          _this4._installSelectors(selector, storage[selectorName], {
            get: store.get[selectorName],
            select: store.select[selectorName],
            core: _this4
          });

          break;
      }
    });
  };

  _proto._installReducers = function _installReducers(reducers, storage, parentReducers, state, parentState, getState, prefix, isLevelUp) {
    var _this5 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(reducers).forEach(function (_ref6) {
      var reducerName = _ref6[0],
          reducer = _ref6[1];
      if (reducerName === 'on') return;

      switch (typeof reducer) {
        case 'function':
          var path = prefix + reducerName;

          if (isLevelUp) {
            var stateKey = prefix.replace(/\/$/, '');

            storage[reducerName] = function () {
              for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                args[_key5] = arguments[_key5];
              }

              _this5.on.commit(path, args);

              _this5._updateState(parentState, reducer.apply(void 0, [getState()].concat(args)), stateKey);

              _this5._callPathInSiblingReducers.apply(_this5, [parentReducers, path, parentState[stateKey], parentState].concat(args));

              _this5._notifiyListeners();

              return parentState[stateKey];
            };
          } else {
            storage[reducerName] = function () {
              for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                args[_key6] = arguments[_key6];
              }

              _this5.on.commit(path, args);

              _this5._updateState(state, reducer.apply(void 0, [getState()].concat(args)));

              _this5._callPathInSiblingReducers.apply(_this5, [parentReducers, path, state, parentState].concat(args));

              _this5._notifiyListeners();

              return state;
            };
          }

          break;

        case 'object':
          storage[reducerName] = {};

          _this5._installReducers(reducer, storage[reducerName], reducers, state[reducerName], state, function () {
            return getState()[reducerName];
          }, prefix + reducerName + '/', typeof state[reducerName] !== 'object');

          break;
      }
    });
  };

  _proto._installActions = function _installActions(actions, storage, store, prefix) {
    var _this6 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(actions).forEach(function (_ref7) {
      var actionName = _ref7[0],
          action = _ref7[1];

      switch (typeof action) {
        case 'function':
          var path = prefix + actionName;

          storage[actionName] = function () {
            for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
              args[_key7] = arguments[_key7];
            }

            _this6.on.dispatch(path, args);

            return action.apply(void 0, [store].concat(args));
          };

          break;

        case 'object':
          storage[actionName] = {};

          _this6._installActions(action, storage[actionName], {
            select: store.select[actionName],
            get: store.get[actionName],
            dispatch: store.dispatch[actionName],
            commit: store.commit[actionName],
            stage: _this6.stage,
            core: _this6
          }, prefix + actionName + '/');

          break;
      }
    });
  };
  /**
  | ------------------
  | Store Methods
  | ------------------
  | Exposed API
  |
  */


  return Store;
}();

export { Store as default };