function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }

import { compose, applyMiddleware } from 'redux';
import ActionTypes from './actionTypes';
import defaultCombineReducers from './combineReducers';
import defaultCreateBatch from './createBatch';
import defaultCreateBatchMiddleware from './createBatchMiddleware';
import defaultCreateReduxAnewProps from './createReduxAnewProps';
import defaultCreateReduxStore from './createReduxStore';
import defaultCreateSetState from './createSetState';
import invariantFunctionProperty from './invariantFunctionProperty';
export default function combineStores(_ref, _temp) {
  var _ref$name = _ref.name,
      name = _ref$name === void 0 ? 'combinedStore' : _ref$name,
      _ref$stores = _ref.stores,
      stores = _ref$stores === void 0 ? [] : _ref$stores,
      persist = _ref.persist,
      enhancer = _ref.enhancer;

  var _ref2 = _temp === void 0 ? {} : _temp,
      _ref2$combineReducers = _ref2.combineReducers,
      combineReducers = _ref2$combineReducers === void 0 ? defaultCombineReducers : _ref2$combineReducers,
      _ref2$createBatch = _ref2.createBatch,
      createBatch = _ref2$createBatch === void 0 ? defaultCreateBatch : _ref2$createBatch,
      _ref2$createBatchMidd = _ref2.createBatchMiddleware,
      createBatchMiddleware = _ref2$createBatchMidd === void 0 ? defaultCreateBatchMiddleware : _ref2$createBatchMidd,
      _ref2$createReduxAnew = _ref2.createReduxAnewProps,
      createReduxAnewProps = _ref2$createReduxAnew === void 0 ? defaultCreateReduxAnewProps : _ref2$createReduxAnew,
      _ref2$createSetState = _ref2.createSetState,
      createSetState = _ref2$createSetState === void 0 ? defaultCreateSetState : _ref2$createSetState,
      _ref2$createReduxStor = _ref2.createReduxStore,
      createReduxStore = _ref2$createReduxStor === void 0 ? defaultCreateReduxStore : _ref2$createReduxStor;

  invariantFunctionProperty(name, 'store combination');
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

  };
  anewStore.setState = createSetState(anewStore);
  /**
   * Generate Combined Anew Store
   */

  var anewReducer = combineReducers(anewStore, stores, persist);
  /**
   * Create anew specific store props
   * @type { Object }
   */

  var anewProps = createReduxAnewProps(anewStore, anewReducer);
  /**
   * Create Batch Middleware with reference to batches
   */

  var enhancerWithMiddlewares = compose.apply(void 0, (enhancer ? [enhancer] : []).concat([applyMiddleware(createBatchMiddleware(anewProps.getBatches))]));
  /**
   * Redux Store
   * @type { Object }
   */

  var reduxStore = createReduxStore(anewReducer, anewStore.state, enhancerWithMiddlewares, persist);
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
  reduxStore.anew = anewProps;
  /**
   * Populate dispatch reducers and effects
   * and update redux dispatch reference
   */

  stores.forEach(function (store) {
    var getState = store.getState,
        name = store.anew.name,
        _store$dispatch = store.dispatch,
        reducers = _store$dispatch.reducers,
        effects = _store$dispatch.effects,
        actions = _store$dispatch.actions,
        _store$dispatch$batch = _store$dispatch.batch,
        done = _store$dispatch$batch.done,
        batches = _objectWithoutPropertiesLoose(_store$dispatch$batch, ["done"]);

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
      reduxStore.dispatch({
        type: ActionTypes.RESET
      });
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
  });
  return reduxStore;
}