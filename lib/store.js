function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { createSelector } from 'reselect';
import isPlainObject from './isPlainObject';
import assert from './assert';

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

      _this._nextSubscriptions.push(listener);

      var unsubscribe = function unsubscribe() {
        if (!isSubscribed) {
          return;
        }

        isSubscribed = false;

        _this._ensureCanMutateNextListeners();

        var index = _this._nextSubscriptions.indexOf(listener);

        _this._nextSubscriptions.splice(index, 1);
      };

      return unsubscribe;
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
    });

    _defineProperty(this, "_stageCommit", function () {
      if (_this.isStaging) {
        _this.isStaging = false;

        _this._notifiySubscriptions();
      }
    });

    _defineProperty(this, "_ensureCanMutateNextListeners", function () {
      if (_this._nextSubscriptions === _this._subscriptions) {
        _this._nextSubscriptions = _this._subscriptions.slice();
      }
    });

    _defineProperty(this, "_notifiySubscriptions", function () {
      if (!_this.isStaging && _this._stateHasChanged) {
        _this._stateHasChanged = false;
        var listeners = _this._subscriptions = _this._nextSubscriptions;
        listeners.forEach(function (listener) {
          return listener();
        });
      }
    });

    _defineProperty(this, "_notifiyListeners", function (path, change) {
      var listener = _this._listeners[path];

      if (listener) {
        for (var _len3 = arguments.length, args = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
          args[_key3 - 2] = arguments[_key3];
        }

        listener.apply(void 0, [change].concat(args));
      }
    });

    if (options) {
      this.use(options);
    }
  }

  var _proto = Store.prototype;

  _proto.use = function use(_ref) {
    if (_ref === void 0) {
      _ref = {};
    }

    var _ref2 = _ref,
        _ref2$plugins = _ref2.plugins,
        plugins = _ref2$plugins === void 0 ? [] : _ref2$plugins,
        options = _objectWithoutPropertiesLoose(_ref2, ["plugins"]);

    // Initialize Listeners
    this._subscriptions = [];
    this._nextSubscriptions = this._subscriptions;
    this._listeners = {};
    this._stateHasChanged = false; // Modify Options

    this._installPlugins(plugins, options);

    var _options$state = options.state,
        state = _options$state === void 0 ? this.state || {} : _options$state,
        _options$reducers = options.reducers,
        reducers = _options$reducers === void 0 ? this.reducers || {} : _options$reducers,
        _options$actions = options.actions,
        actions = _options$actions === void 0 ? this.actions || {} : _options$actions,
        _options$getters = options.getters,
        getters = _options$getters === void 0 ? this.getters || {} : _options$getters,
        _options$selectors = options.selectors,
        selectors = _options$selectors === void 0 ? this.selectors || {} : _options$selectors,
        _options$listeners = options.listeners,
        listeners = _options$listeners === void 0 ? this.listeners || {} : _options$listeners,
        _options$modules = options.modules,
        modules = _options$modules === void 0 ? this.modules : _options$modules; // Assign Options

    this.state = typeof state === 'object' ? _objectSpread({}, state) : state;
    this.reducers = reducers;
    this.actions = actions;
    this.getters = getters;
    this.selectors = selectors;
    this.listeners = listeners;
    this.modules = modules; // Initialize Store

    this._initStore(); // Install Options (From, To, ..args)


    this._installModules(modules, this);

    this._installGetters(getters, this.get);

    this._installSelectors(selectors, this.select, {
      get: this.get,
      select: this.select
    });

    this._installReducers(reducers, this.commit, this.state, this.get);

    this._installActions(actions, this.dispatch, this);

    this._installListeners(this.listeners, this._listeners, this.state, this);
  };

  _proto._installPlugins = function _installPlugins(plugins, options) {
    var _this2 = this;

    if (plugins.length) {
      var param = {
        get: function get() {
          return options;
        },
        inject: function inject(update) {
          return options = Object.assign(options, update);
        }
      };
      plugins.forEach(function (plugin) {
        return plugin(_this2, param);
      });
    }
  };

  _proto._initStore = function _initStore() {
    this.select = {};
    this.stage.commit = this._stageCommit;
  };

  _proto._installModules = function _installModules(modules, storage) {
    var _this3 = this;

    if (modules === void 0) {
      modules = {};
    }

    Object.entries(modules).forEach(function (_ref3) {
      var moduleName = _ref3[0],
          module = _ref3[1];
      if (module.state === undefined) module.state = {};
      if (!module.getters) module.getters = {};
      Object.keys(module).forEach(function (type) {
        switch (type) {
          case 'modules':
            _this3._installModules(module.modules, module);

            break;

          default:
            if (!storage[type]) storage[type] = {};

            if (storage[type][moduleName]) {
              storage[type][moduleName] = Object.assign({}, module[type], storage[type][moduleName]);
            } else {
              storage[type][moduleName] = module[type];
            }

            break;
        }
      });
    });
  };

  _proto._installGetters = function _installGetters(getters, getState) {
    var _this4 = this;

    Object.entries(getters).forEach(function (_ref4) {
      var getName = _ref4[0],
          get = _ref4[1];

      switch (typeof get) {
        case 'function':
          getState[getName] = function () {
            for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
              args[_key4] = arguments[_key4];
            }

            return get.apply(void 0, [getState()].concat(args));
          };

          break;

        case 'object':
          getState[getName] = function () {
            return getState()[getName];
          };

          _this4._installGetters(get, getState[getName]);

          break;
      }
    });
  };

  _proto._installSelectors = function _installSelectors(selectors, storage, store) {
    var _this5 = this;

    Object.entries(selectors).forEach(function (_ref5) {
      var selectorName = _ref5[0],
          selector = _ref5[1];

      switch (typeof selector) {
        case 'function':
          storage[selectorName] = createSelector.apply(void 0, selector(store));
          break;

        case 'object':
          storage[selectorName] = {};

          _this5._installSelectors(selector, storage[selectorName], {
            get: store.get[selectorName],
            select: store.select[selectorName],
            core: _this5
          });

          break;
      }
    });
  };

  _proto._installReducers = function _installReducers(reducers, storage, stateRef, getState, prefix, propagate) {
    var _this6 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    if (propagate === void 0) {
      propagate = typeof stateRef !== 'object' ? function (change) {
        return _this6.state = change;
      } : function (change, containerName) {
        var _ref6;

        _this6.state = Object.assign({}, _this6.state, containerName ? (_ref6 = {}, _ref6[containerName] = change, _ref6) : change);
        return _this6.state;
      };
    }

    Object.entries(reducers).forEach(function (_ref7) {
      var reducerName = _ref7[0],
          reducer = _ref7[1];
      var path = prefix + reducerName;

      switch (typeof reducer) {
        case 'function':
          storage[reducerName] = function () {
            var state = getState();

            for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
              args[_key5] = arguments[_key5];
            }

            var change = reducer.apply(void 0, [state].concat(args));
            _this6._stateHasChanged = change !== undefined && change !== state;

            if (_this6._stateHasChanged) {
              propagate(change);
            }

            _this6._notifiyListeners.apply(_this6, [path, getState()].concat(args));

            _this6._notifiySubscriptions();

            return change;
          };

          break;

        case 'object':
          storage[reducerName] = {};
          var targetGetState = getState[reducerName];
          var targetState = typeof stateRef === 'object' && stateRef[reducerName];
          var objectInstance = isPlainObject(targetState) ? {} : [];
          var nextPropogation = targetState && typeof targetState !== 'object' ? function (change) {
            var _propagate;

            return propagate((_propagate = {}, _propagate[reducerName] = change, _propagate));
          } : function (change, containerName) {
            var _ref8;

            return propagate(Object.assign(objectInstance, targetGetState(), containerName ? (_ref8 = {}, _ref8[containerName] = change, _ref8) : change), reducerName);
          };

          _this6._installReducers(reducer, storage[reducerName], targetState, targetGetState, path + '/', nextPropogation || propagate);

          break;
      }
    });
  };

  _proto._installActions = function _installActions(actions, storage, store, prefix) {
    var _this7 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(actions).forEach(function (_ref9) {
      var actionName = _ref9[0],
          action = _ref9[1];
      var path = prefix + actionName;

      switch (typeof action) {
        case 'function':
          storage[actionName] = function () {
            for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
              args[_key6] = arguments[_key6];
            }

            return action.apply(void 0, [store].concat(args));
          };

          break;

        case 'object':
          storage[actionName] = {};

          _this7._installActions(action, storage[actionName], {
            select: store.select[actionName],
            get: store.get[actionName],
            dispatch: store.dispatch[actionName],
            commit: store.commit[actionName],
            stage: _this7.stage,
            core: _this7
          }, path + '/');

          break;
      }
    });
  };

  _proto._installListeners = function _installListeners(listeners, storage, state, store, prefix) {
    var _this8 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    var listenerKeys = Object.keys(listeners);

    var _loop = function _loop(i, listenersLen) {
      var contextName = listenerKeys[i];
      var context = listeners[contextName];
      var contextKeys = Object.keys(context);
      var contextStore = {
        select: store.select[contextName] || {},
        get: store.get[contextName] || {},
        dispatch: store.dispatch[contextName] || {},
        commit: store.commit[contextName] || {},
        stage: _this8.stage,
        core: _this8
      };

      for (var j = 0, contextLen = contextKeys.length; j < contextLen; j++) {
        var targetName = contextKeys[j];
        var target = context[targetName];
        if (typeof target !== 'object') continue;
        var targetKeys = Object.keys(target);

        var _loop2 = function _loop2(k, targetLen) {
          var reducerName = targetKeys[k];
          var reducer = target[reducerName];

          switch (typeof reducer) {
            case 'function':
              var prevListener = context["" + prefix + targetName + "/" + reducerName];
              var prevListenerBinded = prevListener && prevListener.bind({});

              if (prevListenerBinded) {
                storage["" + prefix + targetName + "/" + reducerName] = function (targetState) {
                  for (var _len7 = arguments.length, args = new Array(_len7 > 1 ? _len7 - 1 : 0), _key7 = 1; _key7 < _len7; _key7++) {
                    args[_key7 - 1] = arguments[_key7];
                  }

                  prevListenerBinded.apply(void 0, args);
                  return reducer.apply(void 0, [contextStore, targetState].concat(args));
                };
              } else {
                storage["" + prefix + targetName + "/" + reducerName] = function (targetState) {
                  for (var _len8 = arguments.length, args = new Array(_len8 > 1 ? _len8 - 1 : 0), _key8 = 1; _key8 < _len8; _key8++) {
                    args[_key8 - 1] = arguments[_key8];
                  }

                  return reducer.apply(void 0, [contextStore, targetState].concat(args));
                };
              }

              break;

            case 'object':
              _this8._installListeners(context, storage, state[contextName], contextStore, contextName + '/');

              break;
          }
        };

        for (var k = 0, targetLen = targetKeys.length; k < targetLen; k++) {
          _loop2(k, targetLen);
        }
      }
    };

    for (var i = 0, listenersLen = listenerKeys.length; i < listenersLen; i++) {
      _loop(i, listenersLen);
    }
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