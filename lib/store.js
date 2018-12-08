function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { createSelector } from 'reselect';
import produce from 'immer';

function assert(condition, msg) {
  if (!condition) throw new Error("[@anew] " + msg);
}

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
      _this.isStaging = false;

      _this._notifiySubscriptions();
    });

    _defineProperty(this, "_ensureCanMutateNextListeners", function () {
      if (_this._nextSubscriptions === _this._subscriptions) {
        _this._nextSubscriptions = _this._subscriptions.slice();
      }
    });

    _defineProperty(this, "_notifiySubscriptions", function () {
      if (!_this.isStaging) {
        var listeners = _this._subscriptions = _this._nextSubscriptions;
        listeners.forEach(function (listener) {
          return listener();
        });
      }
    });

    _defineProperty(this, "_notifiyListeners", function (path) {
      var listener = _this._listeners[path];

      if (listener) {
        for (var _len3 = arguments.length, args = new Array(_len3 > 1 ? _len3 - 1 : 0), _key3 = 1; _key3 < _len3; _key3++) {
          args[_key3 - 1] = arguments[_key3];
        }

        listener.apply(void 0, args);
      }
    });

    if (options) {
      this.use(options);
    }
  }

  var _proto = Store.prototype;

  _proto.use = function use(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        _ref$state = _ref.state,
        state = _ref$state === void 0 ? this.state || {} : _ref$state,
        _ref$reducers = _ref.reducers,
        reducers = _ref$reducers === void 0 ? this.reducers || {} : _ref$reducers,
        _ref$mutations = _ref.mutations,
        mutations = _ref$mutations === void 0 ? this.mutations || {} : _ref$mutations,
        _ref$actions = _ref.actions,
        actions = _ref$actions === void 0 ? this.actions || {} : _ref$actions,
        _ref$getters = _ref.getters,
        getters = _ref$getters === void 0 ? this.getters || {} : _ref$getters,
        _ref$selectors = _ref.selectors,
        selectors = _ref$selectors === void 0 ? this.selectors || {} : _ref$selectors,
        _ref$listeners = _ref.listeners,
        listeners = _ref$listeners === void 0 ? this.listeners || {} : _ref$listeners,
        _ref$modules = _ref.modules,
        modules = _ref$modules === void 0 ? this.modules : _ref$modules;

    if (process.env.NODE_ENV !== 'production') {
      if (Object.keys(mutations).length) {
        var stateType = typeof state;
        assert(stateType === 'object', "state must be an object to use mutations (state: " + stateType + ")");
      }
    } // Assign Options


    this.state = state;
    this.mutations = mutations;
    this.reducers = reducers;
    this.actions = actions;
    this.getters = getters;
    this.selectors = selectors;
    this.listeners = listeners;
    this.modules = modules; // Initialize Listeners

    this._subscriptions = [];
    this._nextSubscriptions = this._subscriptions;
    this._listeners = {}; // Initialize Store

    this._initStore(); // Install Options (From, To, ..args)


    this._installModules(modules, this);

    this._installGetters(getters, this.get);

    this._installSelectors(selectors, this.select, {
      get: this.get,
      select: this.select
    });

    this._installMutations(mutations, this.commit, this.state, this.get);

    this._installReducers(reducers, this.commit, this.state, {}, this.get);

    this._installActions(actions, this.dispatch, this);

    this._installListeners(this.listeners, this._listeners, this.state, this);
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

    Object.entries(modules).forEach(function (_ref2) {
      var moduleName = _ref2[0],
          module = _ref2[1];
      if (module.state === undefined) module.state = {};

      if (process.env.NODE_ENV !== 'production') {
        if (Object.keys(module.mutations).length) {
          var stateType = typeof module.state;
          assert(stateType === 'object', "state must be an object to use mutations (state: " + stateType + ", for: " + moduleName + ")");
        }
      }

      Object.keys(module).forEach(function (type) {
        switch (type) {
          case 'modules':
            _this2._installModules(module.modules, module);

            break;

          default:
            if (!storage[type]) storage[type] = {};
            storage[type][moduleName] = module[type];
            break;
        }
      });
    });
  };

  _proto._installGetters = function _installGetters(getters, storeGet) {
    var _this3 = this;

    Object.entries(getters).forEach(function (_ref3) {
      var getName = _ref3[0],
          get = _ref3[1];

      switch (typeof get) {
        case 'function':
          storeGet[getName] = function () {
            for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
              args[_key4] = arguments[_key4];
            }

            return get.apply(void 0, [storeGet()].concat(args));
          };

          break;

        case 'object':
          storeGet[getName] = function () {
            return storeGet()[getName];
          };

          _this3._installGetters(get, storeGet[getName]);

          break;
      }
    });
  };

  _proto._installSelectors = function _installSelectors(selectors, storage, store) {
    var _this4 = this;

    Object.entries(selectors).forEach(function (_ref4) {
      var selectorName = _ref4[0],
          selector = _ref4[1];

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

  _proto._installMutations = function _installMutations(mutations, storage, state, getState, prefix) {
    var _this5 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(mutations).forEach(function (_ref5) {
      var mutationName = _ref5[0],
          mutation = _ref5[1];
      var path = prefix + mutationName;

      switch (typeof mutation) {
        case 'function':
          storage[mutationName] = function () {
            for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
              args[_key5] = arguments[_key5];
            }

            state = Object.assign(state, produce(state, function (draft) {
              return mutation.apply(void 0, [draft].concat(args));
            }));

            _this5._notifiyListeners.apply(_this5, [path].concat(args));

            _this5._notifiySubscriptions();

            return state;
          };

          break;

        case 'object':
          storage[mutationName] = {};

          _this5._installMutations(mutation, storage[mutationName], state[mutationName], function () {
            return getState()[mutationName];
          }, path + '/');

          break;
      }
    });
  };

  _proto._installReducers = function _installReducers(reducers, storage, state, parentState, getState, prefix, stateKey) {
    var _this6 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(reducers).forEach(function (_ref6) {
      var reducerName = _ref6[0],
          reducer = _ref6[1];
      var path = prefix + reducerName;

      switch (typeof reducer) {
        case 'function':
          if (typeof state !== 'object' && !stateKey) {
            // if root state is primitive value
            storage[reducerName] = function () {
              for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
                args[_key6] = arguments[_key6];
              }

              _this6.state = reducer.apply(void 0, [_this6.state].concat(args));

              _this6._notifiyListeners.apply(_this6, [path].concat(args));

              _this6._notifiySubscriptions();

              return _this6.state;
            };
          } else if (stateKey) {
            // if target state is primitive value
            storage[reducerName] = function () {
              for (var _len7 = arguments.length, args = new Array(_len7), _key7 = 0; _key7 < _len7; _key7++) {
                args[_key7] = arguments[_key7];
              }

              parentState[stateKey] = reducer.apply(void 0, [getState()].concat(args));

              _this6._notifiyListeners.apply(_this6, [path].concat(args));

              _this6._notifiySubscriptions();

              return parentState[stateKey];
            };
          } else {
            // if target state is object
            storage[reducerName] = function () {
              for (var _len8 = arguments.length, args = new Array(_len8), _key8 = 0; _key8 < _len8; _key8++) {
                args[_key8] = arguments[_key8];
              }

              state = Object.assign(state, reducer.apply(void 0, [getState()].concat(args)));

              _this6._notifiyListeners.apply(_this6, [path].concat(args));

              _this6._notifiySubscriptions();

              return state;
            };
          }

          break;

        case 'object':
          storage[reducerName] = {};
          var childState = state[reducerName];

          _this6._installReducers(reducer, storage[reducerName], childState, state, function () {
            return getState()[reducerName];
          }, path + '/', typeof childState !== 'object' && path);

          break;
      }
    });
  };

  _proto._installActions = function _installActions(actions, storage, store, prefix) {
    var _this7 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(actions).forEach(function (_ref7) {
      var actionName = _ref7[0],
          action = _ref7[1];
      var path = prefix + actionName;

      switch (typeof action) {
        case 'function':
          storage[actionName] = function () {
            for (var _len9 = arguments.length, args = new Array(_len9), _key9 = 0; _key9 < _len9; _key9++) {
              args[_key9] = arguments[_key9];
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

      var _loop2 = function _loop2(j, contextLen) {
        var targetName = contextKeys[j];
        var target = context[targetName];
        if (typeof target !== 'object') return "continue";
        var targetKeys = Object.keys(target);
        var targetState = state[targetName];

        var _loop3 = function _loop3(k, targetLen) {
          var reducerName = targetKeys[k];
          var reducer = target[reducerName];

          switch (typeof reducer) {
            case 'function':
              var prevListener = context["" + prefix + targetName + "/" + reducerName];
              var prevListenerBinded = prevListener && prevListener.bind({});

              if (prevListenerBinded) {
                storage["" + prefix + targetName + "/" + reducerName] = function () {
                  for (var _len10 = arguments.length, args = new Array(_len10), _key10 = 0; _key10 < _len10; _key10++) {
                    args[_key10] = arguments[_key10];
                  }

                  prevListenerBinded.apply(void 0, args);
                  return reducer.apply(void 0, [contextStore, targetState].concat(args));
                };
              } else {
                storage["" + prefix + targetName + "/" + reducerName] = function () {
                  for (var _len11 = arguments.length, args = new Array(_len11), _key11 = 0; _key11 < _len11; _key11++) {
                    args[_key11] = arguments[_key11];
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
          _loop3(k, targetLen);
        }
      };

      for (var j = 0, contextLen = contextKeys.length; j < contextLen; j++) {
        var _ret = _loop2(j, contextLen);

        if (_ret === "continue") continue;
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