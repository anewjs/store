function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { createSelector } from 'reselect';

var Store =
/*#__PURE__*/
function () {
  function Store(options) {
    var _this = this;

    _defineProperty(this, "get", function () {
      return _this.state;
    });

    _defineProperty(this, "dispatch", function (action) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      _this.on.dispatch(action, args);

      if (action[0] === '+') return;
      var paths = action.split('/');
      var lastPathIndex = paths.length - 1;
      return paths.reduce(function (actionObj, path, i) {
        if (i === lastPathIndex) {
          var _actionObj$;

          return (_actionObj$ = actionObj[0])[path].apply(_actionObj$, [actionObj[1]].concat(args));
        }

        return [actionObj[0][path], {
          select: actionObj[1].select[path],
          get: actionObj[1].get[path],
          dispatch: actionObj[1].dispatch[path],
          commit: actionObj[1].commit[path],
          stage: _this.stage,
          core: _this
        }];
      }, [_this.actions, _this]);
    });

    _defineProperty(this, "commit", function (reducer) {
      for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
        args[_key2 - 1] = arguments[_key2];
      }

      _this.on.commit(reducer, args);

      if (reducer[0] === '+') return;
      var paths = reducer.split('/');
      var lastPathIndex = paths.length - 1;
      var nextState = _this.state;
      var levelUp;
      return paths.reduce(function (reducerObj, path, i) {
        if (i === lastPathIndex) {
          if (levelUp) {
            return nextState[levelUp] = _this.updateState(nextState[levelUp], reducerObj[path].apply(reducerObj, [nextState[levelUp]].concat(args)));
          } else {
            return _this.updateState(nextState, reducerObj[path].apply(reducerObj, [nextState].concat(args)));
          }
        }

        if (i === lastPathIndex - 1 && typeof nextState[path] !== 'object') {
          levelUp = path;
        } else {
          nextState = nextState[path];
        }

        return reducerObj[path];
      }, _this.reducers);
    });

    _defineProperty(this, "stage", function () {
      _this.isStaging = true;

      _this.on.commit('@anew/STAGE_START');
    });

    _defineProperty(this, "stageCommit", function () {
      _this.isStaging = false;

      _this.on.commit('@anew/STAGE_COMPLETE');
    });

    _defineProperty(this, "updateState", function (state, change) {
      if (change && change !== state) {
        _this.on.update(state);

        if (typeof state === 'object') {
          state = Object.assign(state, change);
        } else {
          state = change;
        }
      }

      return state;
    });

    this.use(options);
  }

  var _proto = Store.prototype;

  _proto.use = function use(_temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        _ref$state = _ref.state,
        state = _ref$state === void 0 ? {} : _ref$state,
        _ref$reducers = _ref.reducers,
        reducers = _ref$reducers === void 0 ? {} : _ref$reducers,
        _ref$actions = _ref.actions,
        actions = _ref$actions === void 0 ? {} : _ref$actions,
        _ref$getters = _ref.getters,
        getters = _ref$getters === void 0 ? {} : _ref$getters,
        _ref$selectors = _ref.selectors,
        selectors = _ref$selectors === void 0 ? {} : _ref$selectors,
        _ref$on = _ref.on,
        on = _ref$on === void 0 ? {} : _ref$on,
        modules = _ref.modules;

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
    this.on = on; // Initialize Store

    this.initStore(); // Install Options (From, To, ..args)

    this.installModules(modules, this);
    this.installGetters(getters, this.get, this.get);
    this.installSelectors(selectors, this.select, this);
    this.installReducers(reducers, this.commit, this.state, this.get);
    this.installActions(actions, this.dispatch, this);
  };

  _proto.initStore = function initStore() {
    this.select = {};
    this.stage.commit = this.stageCommit;
  };

  _proto.installModules = function installModules(modules, storage) {
    var _this2 = this;

    if (modules === void 0) {
      modules = {};
    }

    Object.entries(modules).forEach(function (_ref2) {
      var moduleName = _ref2[0],
          module = _ref2[1];
      if (module.state === undefined) module.state = {};
      Object.keys(module).forEach(function (type) {
        switch (type) {
          case 'modules':
            _this2.installModules(module.modules, module);

            break;

          default:
            storage[type][moduleName] = module[type];
            break;
        }
      });
    });
  };

  _proto.installGetters = function installGetters(getters, storage, getState) {
    var _this3 = this;

    Object.entries(getters).forEach(function (_ref3) {
      var getName = _ref3[0],
          get = _ref3[1];

      switch (typeof get) {
        case 'function':
          storage[getName] = function () {
            for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
              args[_key3] = arguments[_key3];
            }

            return get.apply(void 0, [getState()].concat(args));
          };

          break;

        case 'object':
          storage[getName] = function () {
            return getState()[getName];
          };

          _this3.installGetters(get, storage[getName], storage[getName]);

          break;
      }
    });
  };

  _proto.installSelectors = function installSelectors(selectors, storage, store) {
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

          _this4.installSelectors(selector, storage[selectorName], {
            get: store.get[selectorName],
            select: store.select[selectorName],
            core: _this4
          });

          break;
      }
    });
  };

  _proto.installReducers = function installReducers(reducers, storage, state, getState, prefix, isLevelUp) {
    var _this5 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(reducers).forEach(function (_ref5) {
      var reducerName = _ref5[0],
          reducer = _ref5[1];

      switch (typeof reducer) {
        case 'function':
          if (isLevelUp) {
            var stateKey = prefix.replace(/\/$/, '');

            storage[reducerName] = function () {
              for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                args[_key4] = arguments[_key4];
              }

              _this5.commit.apply(_this5, ['+' + prefix + reducerName].concat(args));

              return state[stateKey] = _this5.updateState(state[stateKey], reducer.apply(void 0, [getState()].concat(args)));
            };
          } else {
            storage[reducerName] = function () {
              for (var _len5 = arguments.length, args = new Array(_len5), _key5 = 0; _key5 < _len5; _key5++) {
                args[_key5] = arguments[_key5];
              }

              _this5.commit.apply(_this5, ['+' + prefix + reducerName].concat(args));

              return _this5.updateState(state, reducer.apply(void 0, [getState()].concat(args)));
            };
          }

          break;

        case 'object':
          storage[reducerName] = {};
          var isObject = typeof state[reducerName] === 'object';

          _this5.installReducers(reducer, storage[reducerName], isObject ? state[reducerName] : state, function () {
            return getState()[reducerName];
          }, prefix + reducerName + '/', !isObject);

          break;
      }
    });
  };

  _proto.installActions = function installActions(actions, storage, store, prefix) {
    var _this6 = this;

    if (prefix === void 0) {
      prefix = '';
    }

    Object.entries(actions).forEach(function (_ref6) {
      var actionName = _ref6[0],
          action = _ref6[1];

      switch (typeof action) {
        case 'function':
          storage[actionName] = function () {
            for (var _len6 = arguments.length, args = new Array(_len6), _key6 = 0; _key6 < _len6; _key6++) {
              args[_key6] = arguments[_key6];
            }

            _this6.dispatch.apply(_this6, ['+' + prefix + actionName].concat(args));

            return action.apply(void 0, [store].concat(args));
          };

          break;

        case 'object':
          storage[actionName] = {};

          _this6.installActions(action, storage[actionName], {
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