function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

import { applyMiddleware, compose, bindActionCreators as defaultBindActionCreators } from 'redux';
import { createSelector as defaultCreateSelector } from 'reselect';
import invariant from 'invariant';
import defaultCreateAnewSelector from './createAnewSelector';
import defaultCreateBatch from './createBatch';
import defaultCreateBatchMiddleware from './createBatchMiddleware';
import defaultCreateReducer from './createReducer';
import defaultCreateReduxAnewProps from './createReduxAnewProps';
import defaultCreateReduxStore from './createReduxStore';
import defaultCreateSetState from './createSetState';
import invariantFunctionProperty from './invariantFunctionProperty';
import invariantPersistState from './invariantPersistState';
import reservedReducerNames from './reservedReducerNames';
export default function createStore(_temp, _temp2) {
  var _ref = _temp === void 0 ? {} : _temp,
      _ref$name = _ref.name,
      name = _ref$name === void 0 ? 'store' : _ref$name,
      _ref$state = _ref.state,
      state = _ref$state === void 0 ? {} : _ref$state,
      _ref$reducers = _ref.reducers,
      reducers = _ref$reducers === void 0 ? {} : _ref$reducers,
      _ref$effects = _ref.effects,
      effects = _ref$effects === void 0 ? {} : _ref$effects,
      _ref$actions = _ref.actions,
      actions = _ref$actions === void 0 ? {} : _ref$actions,
      _ref$selectors = _ref.selectors,
      selectors = _ref$selectors === void 0 ? {} : _ref$selectors,
      persist = _ref.persist,
      reducer = _ref.reducer,
      enhancer = _ref.enhancer;

  var _ref2 = _temp2 === void 0 ? {} : _temp2,
      _ref2$createReduxStor = _ref2.createReduxStore,
      createReduxStore = _ref2$createReduxStor === void 0 ? defaultCreateReduxStore : _ref2$createReduxStor,
      _ref2$createBatch = _ref2.createBatch,
      createBatch = _ref2$createBatch === void 0 ? defaultCreateBatch : _ref2$createBatch,
      _ref2$createBatchMidd = _ref2.createBatchMiddleware,
      createBatchMiddleware = _ref2$createBatchMidd === void 0 ? defaultCreateBatchMiddleware : _ref2$createBatchMidd,
      _ref2$createReducer = _ref2.createReducer,
      createReducer = _ref2$createReducer === void 0 ? defaultCreateReducer : _ref2$createReducer,
      _ref2$createReduxAnew = _ref2.createReduxAnewProps,
      createReduxAnewProps = _ref2$createReduxAnew === void 0 ? defaultCreateReduxAnewProps : _ref2$createReduxAnew,
      _ref2$createSetState = _ref2.createSetState,
      createSetState = _ref2$createSetState === void 0 ? defaultCreateSetState : _ref2$createSetState,
      _ref2$createAnewSelec = _ref2.createAnewSelector,
      createAnewSelector = _ref2$createAnewSelec === void 0 ? defaultCreateAnewSelector : _ref2$createAnewSelec,
      _ref2$createSelector = _ref2.createSelector,
      createSelector = _ref2$createSelector === void 0 ? defaultCreateSelector : _ref2$createSelector,
      _ref2$bindActionCreat = _ref2.bindActionCreators,
      bindActionCreators = _ref2$bindActionCreat === void 0 ? defaultBindActionCreators : _ref2$bindActionCreat;

  invariantPersistState(name, state, persist);
  invariantFunctionProperty(name, 'store creation');
  invariant(typeof reducer !== 'object', "Wrong type \"reducer\" was passed as an object instead of a function " + ("for the store named \"" + name + "\". It seems like you accidentally ") + "spelled reducers as reducer. The reducer parameter can only be a " + "function, recieved an object instead.");
  /**
   * Create Object to preserve reference
   */

  var anewStore = {
    name: name,
    state: state,
    reducers: reducers,
    actions: actions,
    selectors: selectors,
    effects: _objectSpread({}, effects),
    batches: [],
    type: 'single'
    /**
     * Create setState method for an immutable state updates.
     * This also set this anewStore as the conext
     */

  };
  anewStore.setState = createSetState(anewStore);
  /**
   * Reduce state to new value after dispatching an action
   * @param  { Object } reduxState      Redux State Object (Not Used)
   * @param  { String } options.type    Redux Type
   * @param  { String } options.payload Redux Payload
   * @param  { Object } options.state   Application Combined State
   * @param  { Object } options.actions Chain of actions to dispatch
   * @return { Object }                 Updated Anew State Object
   */

  var anewReducer = createReducer(anewStore, reducer, persist);
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
   * Extend Dispatcher to include reducers, effects, and batch.
   *
   * Reducers: are pure functions that reduce the state to a shallow clone of
   * the previous state with modification. The state object is updated via
   * the dispatch method. Reducers receive the state object and a payload list as parameters.
   * A reducer defined within the store that lives under an outside namespace receive both
   * the active and outside namespace state objects and a payload list as parameters.
   *
   * Effects: are pure functions that fire regular/batched dispatches. They are useful for
   * executing async logic. The context is bound to the anewStore object. Effects receive the
   * store object and a payload list as parameters.
   *
   * Actions: are pure functions that return an action object. They are mainly used for
   * user defined reducers that have user defined action types. This can be useful for
   * using with pacakges that follow the standard redux api, such as `react-router-redux`.
   * Actions receive a payload list as parameters.
   *
   * Batch: is a dispatch method for executing mutluple dispatches (reducers) via one dispatch
   * call. This prevents the need for components to re-render for each dispatch fired. Batch
   * also includes a done method which is used to mark the completion of a batch. The done method
   * syncs the anewStore state object with the reduxStore state object and clears the
   * batch registry.
   *
   */

  reduxStore.dispatch.reducers = {};
  reduxStore.dispatch.effects = {};
  reduxStore.dispatch.actions = {};
  reduxStore.dispatch.batch = createBatch(reduxStore);
  reduxStore.anew = anewProps;
  /**
   * Transfer redux store dispatch methods.
   * Avoid referencing for dispatch and batch as their references
   * will be updated when stores are combined.
   */

  anewStore.dispatch = function (action) {
    return reduxStore.dispatch(action);
  };

  anewStore.batch = function (batch) {
    return reduxStore.dispatch.batch(batch);
  };

  anewStore.batch.done = reduxStore.dispatch.batch.done;
  /**
   * Trasfer redux store getState methods
   */

  anewStore.select = function () {
    return reduxStore.getState();
  };
  /**
   * Populate getState selectors
   */


  var selectorParams = {
    select: anewStore.select,
    create: createAnewSelector(anewStore, reduxStore)
  };
  Object.entries(selectors).forEach(function (_ref3) {
    var selectorName = _ref3[0],
        selectorCreator = _ref3[1];

    if (invariantFunctionProperty(selectorName, name)) {
      function selectorWithParams() {
        if (!selectorParams.core && reduxStore.anew.core) {
          selectorParams.core = reduxStore.anew.core.getState;
        }

        var selector = selectorCreator(selectorParams);

        var _selector = selector.apply(void 0, arguments),
            ref = _selector.ref,
            value = _selector.value;

        reduxStore.getState[selectorName] = ref;
        anewStore.select[selectorName] = ref;
        return value;
      }

      reduxStore.getState[selectorName] = selectorWithParams;
      anewStore.select[selectorName] = selectorWithParams;
    }
  });
  /**
   * Populate dispatch reducers
   */

  Object.entries(reducers).forEach(function (_ref4) {
    var reducerName = _ref4[0],
        reducer = _ref4[1];
    var reducerType = typeof reducer;
    var isFunction = reducerType === 'function';
    var isObject = reducerType === 'object';
    invariant(reservedReducerNames.indexOf(reducerName) === -1, "\"" + reducerName + " is a reserved reducer word. Please choose a different name \" " + ("for \"" + reducerName + "\" in \"" + name + "\""));
    invariant(isFunction || isObject, "Store reducers can be functions or objects " + ("Recieved \"" + reducerType + "\" ") + ("for \"" + reducerName + "\" in \"" + name + "\""));

    if (isFunction) {
      reduxStore.dispatch.reducers[reducerName] = function () {
        for (var _len = arguments.length, payload = new Array(_len), _key = 0; _key < _len; _key++) {
          payload[_key] = arguments[_key];
        }

        return reduxStore.dispatch({
          type: anewStore.name + ":" + reducerName,
          payload: payload
        });
      };

      reduxStore.dispatch.batch[reducerName] = function () {
        for (var _len2 = arguments.length, payload = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          payload[_key2] = arguments[_key2];
        }

        var batch = {
          type: anewStore.name + ":" + reducerName,
          payload: payload
        };
        reduxStore.anew.getBatches().push(batch);
        return batch;
      };

      anewStore.dispatch[reducerName] = reduxStore.dispatch.reducers[reducerName];
      anewStore.batch[reducerName] = reduxStore.dispatch.batch[reducerName];
    }
  });
  /**
   * Populate dispatch actions
   * Referencing anewStore.dispatch so when reduxStore.dispatch changes
   * during combination
   */

  reduxStore.dispatch.actions = bindActionCreators(anewStore.actions, anewStore.dispatch);
  anewStore.actions = reduxStore.dispatch.actions;
  /**
   * Populate dispatch effects
   */

  var effectParams = {
    actions: anewStore.actions,
    batch: anewStore.batch,
    dispatch: anewStore.dispatch,
    effects: anewStore.effects,
    select: anewStore.select
  };
  Object.entries(effects).forEach(function (_ref5) {
    var effectName = _ref5[0],
        effect = _ref5[1];
    var effectType = typeof effect;
    invariant(effectType === 'function', "Store effects can only be functions " + ("Recieved \"" + effectType + "\" ") + ("for \"" + effectName + "\" in \"" + anewStore.name + "\""));

    function effectWithParams() {
      if (!effectParams.persistor && reduxStore.dispatch.persistor) {
        effectParams.persistor = reduxStore.dispatch.persistor;
      }

      if (!effectParams.core && reduxStore.anew.core) {
        var _reduxStore$anew$core = reduxStore.anew.core,
            getState = _reduxStore$anew$core.getState,
            _reduxStore$anew$core2 = _reduxStore$anew$core.dispatch,
            _reducers = _reduxStore$anew$core2.reducers,
            _effects = _reduxStore$anew$core2.effects,
            _actions = _reduxStore$anew$core2.actions,
            batch = _reduxStore$anew$core2.batch;
        effectParams.core = {
          select: getState,
          dispatch: _reducers,
          batch: batch,
          effects: _effects,
          actions: _actions
        };
      }

      function effectsBinded() {
        for (var _len3 = arguments.length, payload = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          payload[_key3] = arguments[_key3];
        }

        return effect.apply(void 0, [effectParams].concat(payload));
      }

      reduxStore.dispatch.effects[effectName] = effectsBinded;
      anewStore.effects[effectName] = effectsBinded;
      return effectsBinded.apply(void 0, arguments);
    }

    reduxStore.dispatch.effects[effectName] = effectWithParams;
    anewStore.effects[effectName] = effectWithParams;
  });
  return reduxStore;
}