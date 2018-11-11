'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) { break; } } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) { _i["return"](); } } finally { if (_d) { throw _e; } } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = createStore;

var _redux = require('redux');

var _reselect = require('reselect');

var _createBatch = require('./createBatch');

var _createBatch2 = _interopRequireDefault(_createBatch);

var _createReducer = require('./createReducer');

var _createReducer2 = _interopRequireDefault(_createReducer);

var _createReduxAnewProps = require('./createReduxAnewProps');

var _createReduxAnewProps2 = _interopRequireDefault(_createReduxAnewProps);

var _createSetState = require('./createSetState');

var _createSetState2 = _interopRequireDefault(_createSetState);

var _createAnewSelector = require('./createAnewSelector');

var _createAnewSelector2 = _interopRequireDefault(_createAnewSelector);

var _createPersistStore = require('./createPersistStore');

var _createPersistStore2 = _interopRequireDefault(_createPersistStore);

var _invariant = require('invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _invariantFunctionProperty = require('./invariantFunctionProperty');

var _invariantFunctionProperty2 = _interopRequireDefault(_invariantFunctionProperty);

var _reservedReducerNames = require('./reservedReducerNames');

var _reservedReducerNames2 = _interopRequireDefault(_reservedReducerNames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createStore(_ref) {
    var _ref$name = _ref.name,
        name = _ref$name === undefined ? 'store' : _ref$name,
        _ref$state = _ref.state,
        state = _ref$state === undefined ? {} : _ref$state,
        _ref$reducers = _ref.reducers,
        reducers = _ref$reducers === undefined ? {} : _ref$reducers,
        _ref$effects = _ref.effects,
        effects = _ref$effects === undefined ? {} : _ref$effects,
        _ref$actions = _ref.actions,
        actions = _ref$actions === undefined ? {} : _ref$actions,
        _ref$selectors = _ref.selectors,
        selectors = _ref$selectors === undefined ? {} : _ref$selectors,
        persist = _ref.persist,
        reducer = _ref.reducer,
        enhancer = _ref.enhancer;

    var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref2$createBatch = _ref2.createBatch,
        createBatch = _ref2$createBatch === undefined ? _createBatch2.default : _ref2$createBatch,
        _ref2$createReducer = _ref2.createReducer,
        createReducer = _ref2$createReducer === undefined ? _createReducer2.default : _ref2$createReducer,
        _ref2$createReduxAnew = _ref2.createReduxAnewProps,
        createReduxAnewProps = _ref2$createReduxAnew === undefined ? _createReduxAnewProps2.default : _ref2$createReduxAnew,
        _ref2$createSetState = _ref2.createSetState,
        createSetState = _ref2$createSetState === undefined ? _createSetState2.default : _ref2$createSetState,
        _ref2$createAnewSelec = _ref2.createAnewSelector,
        createAnewSelector = _ref2$createAnewSelec === undefined ? _createAnewSelector2.default : _ref2$createAnewSelec,
        _ref2$createPersistSt = _ref2.createPersistStore,
        createPersistStore = _ref2$createPersistSt === undefined ? _createPersistStore2.default : _ref2$createPersistSt,
        _ref2$createSelector = _ref2.createSelector,
        createSelector = _ref2$createSelector === undefined ? _reselect.createSelector : _ref2$createSelector,
        _ref2$createReduxStor = _ref2.createReduxStore,
        createReduxStore = _ref2$createReduxStor === undefined ? _redux.createStore : _ref2$createReduxStor,
        _ref2$bindActionCreat = _ref2.bindActionCreators,
        bindActionCreators = _ref2$bindActionCreat === undefined ? _redux.bindActionCreators : _ref2$bindActionCreat;

    (0, _invariantFunctionProperty2.default)(name, 'store creation');

    /**
     * Create Object to preserve reference
     */
    var anewStore = {
        name: name,
        state: state,
        reducers: reducers,
        actions: actions,
        selectors: selectors,
        effects: _extends({}, effects),
        batches: []

        /**
         * Create setState method for an immutable state updates.
         * This also set this anewStore as the conext
         */
    };anewStore.setState = createSetState(anewStore);

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
     * Redux Store
     * @type { Object }
     */
    var store = createReduxStore(anewReducer, anewStore.state, enhancer);
    var reduxStore = createPersistStore(persist, store);

    /**
     * Create anew specific store props
     * @type { Object }
     */
    reduxStore.anew = createReduxAnewProps(anewStore, anewReducer);

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
    anewStore.select = {};

    /**
     * Populate getState selectors
     */
    var selectorParams = {
        select: anewStore.select,
        create: createAnewSelector(anewStore, reduxStore)
    };

    var _a = Object.entries(selectors);

    var _f = function _f(_ref3) {
        var _ref4 = _slicedToArray(_ref3, 2),
            selectorName = _ref4[0],
            selectorCreator = _ref4[1];

        (0, _invariantFunctionProperty2.default)(selectorName, name);

        function selectorWithParams() {
            if (!selectorParams.core && reduxStore.anew.core) {
                selectorParams.core = reduxStore.anew.core.getState;
            }

            var selector = selectorCreator(selectorParams);

            var _selector = selector.apply(undefined, arguments),
                ref = _selector.ref,
                value = _selector.value;

            reduxStore.getState[selectorName] = ref;
            anewStore.select[selectorName] = ref;

            return value;
        }

        reduxStore.getState[selectorName] = selectorWithParams;
        anewStore.select[selectorName] = selectorWithParams;
    };

    for (var _i = 0; _i < _a.length; _i++) {
        _f(_a[_i], _i, _a);
    }

    undefined;

    /**
     * Populate dispatch reducers
     */

    var _a2 = Object.entries(reducers);

    var _f2 = function _f2(_ref5) {
        var _ref6 = _slicedToArray(_ref5, 2),
            reducerName = _ref6[0],
            reducer = _ref6[1];

        var reducerType = typeof reducer === 'undefined' ? 'undefined' : _typeof(reducer);
        var isFunction = reducerType === 'function';
        var isObject = reducerType === 'object';

        (0, _invariant2.default)(_reservedReducerNames2.default.indexOf(reducerName) === -1, '"' + reducerName + ' is a reserved reducer word. Please choose a different name " ' + ('for "' + reducerName + '" in "' + name + '"'));

        (0, _invariant2.default)(isFunction || isObject, 'Store reducers can be functions or objects ' + ('Recieved "' + reducerType + '" ') + ('for "' + reducerName + '" in "' + name + '"'));

        if (isFunction) {
            reduxStore.dispatch.reducers[reducerName] = function () {
                for (var _len = arguments.length, payload = Array(_len), _key = 0; _key < _len; _key++) {
                    payload[_key] = arguments[_key];
                }

                return reduxStore.dispatch({
                    type: anewStore.name + ':' + reducerName,
                    payload: payload
                });
            };

            reduxStore.dispatch.batch[reducerName] = function () {
                for (var _len2 = arguments.length, payload = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    payload[_key2] = arguments[_key2];
                }

                var batch = { type: anewStore.name + ':' + reducerName, payload: payload };

                reduxStore.anew.getBatches().push(batch);

                return batch;
            };

            anewStore.dispatch[reducerName] = reduxStore.dispatch.reducers[reducerName];
            anewStore.batch[reducerName] = reduxStore.dispatch.batch[reducerName];
        }
    };

    for (var _i2 = 0; _i2 < _a2.length; _i2++) {
        _f2(_a2[_i2], _i2, _a2);
    }

    undefined;

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

    var _a3 = Object.entries(effects);

    var _f3 = function _f3(_ref7) {
        var _ref8 = _slicedToArray(_ref7, 2),
            effectName = _ref8[0],
            effect = _ref8[1];

        var effectType = typeof effect === 'undefined' ? 'undefined' : _typeof(effect);

        (0, _invariant2.default)(effectType === 'function', 'Store effects can only be functions ' + ('Recieved "' + effectType + '" ') + ('for "' + effectName + '" in "' + anewStore.name + '"'));

        function effectWithParams() {
            if (!effectParams.persistor && reduxStore.dispatch.persistor) {
                effectParams.persistor = reduxStore.dispatch.persistor;
            }

            if (!effectParams.core && reduxStore.anew.core) {
                var _reduxStore$anew$core = reduxStore.anew.core,
                    getState = _reduxStore$anew$core.getState,
                    firestore = _reduxStore$anew$core.firestore,
                    _reduxStore$anew$core2 = _reduxStore$anew$core.dispatch,
                    _reducers = _reduxStore$anew$core2.reducers,
                    _effects = _reduxStore$anew$core2.effects,
                    _actions = _reduxStore$anew$core2.actions,
                    batch = _reduxStore$anew$core2.batch;


                effectParams.firestore = firestore;

                effectParams.core = {
                    select: getState,
                    dispatch: _reducers,
                    batch: batch,
                    effects: _effects,
                    actions: _actions
                };
            }

            function effectsBinded() {
                for (var _len3 = arguments.length, payload = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    payload[_key3] = arguments[_key3];
                }

                return effect.apply(undefined, [effectParams].concat(payload));
            }

            reduxStore.dispatch.effects[effectName] = effectsBinded;
            anewStore.effects[effectName] = effectsBinded;

            return effectsBinded.apply(undefined, arguments);
        }

        reduxStore.dispatch.effects[effectName] = effectWithParams;
        anewStore.effects[effectName] = effectWithParams;
    };

    for (var _i3 = 0; _i3 < _a3.length; _i3++) {
        _f3(_a3[_i3], _i3, _a3);
    }

    undefined;

    return reduxStore;
}