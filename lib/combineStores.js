'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = combineStores;

var _redux = require('redux');

var _actionTypes = require('./actionTypes');

var _actionTypes2 = _interopRequireDefault(_actionTypes);

var _combineReducers = require('./combineReducers');

var _combineReducers2 = _interopRequireDefault(_combineReducers);

var _createBatch = require('./createBatch');

var _createBatch2 = _interopRequireDefault(_createBatch);

var _createBatchMiddleware = require('./createBatchMiddleware');

var _createBatchMiddleware2 = _interopRequireDefault(_createBatchMiddleware);

var _createReduxAnewProps = require('./createReduxAnewProps');

var _createReduxAnewProps2 = _interopRequireDefault(_createReduxAnewProps);

var _createReduxStore = require('./createReduxStore');

var _createReduxStore2 = _interopRequireDefault(_createReduxStore);

var _createSetState = require('./createSetState');

var _createSetState2 = _interopRequireDefault(_createSetState);

var _invariantFunctionProperty = require('./invariantFunctionProperty');

var _invariantFunctionProperty2 = _interopRequireDefault(_invariantFunctionProperty);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) { continue; } if (!Object.prototype.hasOwnProperty.call(obj, i)) { continue; } target[i] = obj[i]; } return target; }

function combineStores(_ref) {
  var _ref$name = _ref.name,
      name = _ref$name === undefined ? 'combinedStore' : _ref$name,
      _ref$stores = _ref.stores,
      stores = _ref$stores === undefined ? [] : _ref$stores,
      persist = _ref.persist,
      enhancer = _ref.enhancer;

  var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
      _ref2$combineReducers = _ref2.combineReducers,
      combineReducers = _ref2$combineReducers === undefined ? _combineReducers2.default : _ref2$combineReducers,
      _ref2$createBatch = _ref2.createBatch,
      createBatch = _ref2$createBatch === undefined ? _createBatch2.default : _ref2$createBatch,
      _ref2$createBatchMidd = _ref2.createBatchMiddleware,
      createBatchMiddleware = _ref2$createBatchMidd === undefined ? _createBatchMiddleware2.default : _ref2$createBatchMidd,
      _ref2$createReduxAnew = _ref2.createReduxAnewProps,
      createReduxAnewProps = _ref2$createReduxAnew === undefined ? _createReduxAnewProps2.default : _ref2$createReduxAnew,
      _ref2$createSetState = _ref2.createSetState,
      createSetState = _ref2$createSetState === undefined ? _createSetState2.default : _ref2$createSetState,
      _ref2$createReduxStor = _ref2.createReduxStore,
      createReduxStore = _ref2$createReduxStor === undefined ? _createReduxStore2.default : _ref2$createReduxStor,
      _ref2$applyMiddleware = _ref2.applyMiddleware,
      applyMiddleware = _ref2$applyMiddleware === undefined ? _redux.applyMiddleware : _ref2$applyMiddleware;

  (0, _invariantFunctionProperty2.default)(name, 'store combination');

  /**
   * Create Object to preserve reference
   */
  var anewStore = {
    name: name,
    state: {},
    reducers: {},
    batches: [],
    type: 'combined'

    /**
     * State Setter with anewStore as the context
     */
  };anewStore.setState = createSetState(anewStore);

  /**
   * Generate Combined Anew Store
   */
  var anewReducer = combineReducers(anewStore, stores, persist);

  /**
   * Create getBatches for early reference
   */
  var getBatches = function getBatches() {
    return anewStore.batches;
  };

  /**
   * Create Batch Middleware with reference to batches
   */
  var createWithMiddlewares = applyMiddleware(createBatchMiddleware(getBatches))(createReduxStore);

  /**
   * Redux Store
   * @type { Object }
   */
  var reduxStore = createWithMiddlewares(anewReducer, anewStore.state, enhancer, persist);

  /**
   * Create anew specific store props
   * @type { Object }
   */
  reduxStore.anew = createReduxAnewProps(anewStore, anewReducer);

  /**
   * Update getBatches Reference
   */
  getBatches = function getBatches() {
    return reduxStore.anew.getBatches();
  };

  /**
   * Extend Dispatcher to include reducers, effects, and batch
   *
   * This must be redefined to update reference to the new combined
   * reduxStore object.
   */
  reduxStore.dispatch.reducers = {};
  reduxStore.dispatch.effects = {};
  reduxStore.dispatch.actions = {};
  reduxStore.dispatch.batch = createBatch(reduxStore, 'combined');

  /**
   * Populate dispatch reducers and effects
   * and update redux dispatch reference
   */
  var _a = stores;

  var _f = function _f(store) {
    var getState = store.getState,
        name = store.anew.name,
        _store$dispatch = store.dispatch,
        reducers = _store$dispatch.reducers,
        effects = _store$dispatch.effects,
        actions = _store$dispatch.actions,
        _store$dispatch$batch = _store$dispatch.batch,
        done = _store$dispatch$batch.done,
        batches = _objectWithoutProperties(_store$dispatch$batch, ['done']);

    var getStoreState = function getStoreState() {
      return reduxStore.getState()[name];
    };

    /**
     * Merge into combined store
     */
    reduxStore.dispatch.reducers[name] = reducers;
    reduxStore.dispatch.effects[name] = effects;
    reduxStore.dispatch.actions[name] = actions;
    reduxStore.dispatch.batch[name] = batches;
    reduxStore.getState[name] = getStoreState;

    /**
     * Update each store references
     */
    store.subscribe = reduxStore.subscribe;
    store.anew.getBatches = function () {
      return reduxStore.anew.getBatches();
    };
    store.dispatch = function (action) {
      return reduxStore.dispatch(action);
    };
    store.getState = getStoreState;

    /**
     * Redefine replace reducer
     */
    store.replaceReducer = function replaceReducer(nextReducer) {
      if (typeof nextReducer !== 'function') {
        throw new Error('Expected the nextReducer to be a function.');
      }

      anewStore.reducers[name] = nextReducer;
      reduxReducer = combineReducers(anewStore.reducers);

      reduxStore.dispatch({ type: _actionTypes2.default.RESET });
    };

    /**
     * Reassign reducers, effects, and batch to maintain dispatch
     * object's shape per store.
     */
    store.dispatch.persistor = reduxStore.persistor;
    store.dispatch.reducers = reducers;
    store.dispatch.effects = effects;
    store.dispatch.actions = actions;
    store.dispatch.batch = batches;
    store.dispatch.batch.done = done;

    /**
     * Reassign selectors to maintian getState
     * object's shape per store
     */
    reduxStore.getState[name] = Object.assign(reduxStore.getState[name], getState);
    store.getState = Object.assign(store.getState, getState);

    /**
     * Assign Core
     */
    store.anew.core = reduxStore;
  };

  for (var _i = 0; _i < _a.length; _i++) {
    _f(_a[_i], _i, _a);
  }

  undefined;

  return reduxStore;
}