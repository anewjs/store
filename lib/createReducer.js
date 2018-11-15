'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createReducer;

var _reduxPersist = require('redux-persist');

var _actionTypes = require('./actionTypes');

var _composeReducers = require('./composeReducers');

var _composeReducers2 = _interopRequireDefault(_composeReducers);

var _createPersistConfig = require('./createPersistConfig');

var _createPersistConfig2 = _interopRequireDefault(_createPersistConfig);

var _toAnewAction = require('./toAnewAction');

var _toAnewAction2 = _interopRequireDefault(_toAnewAction);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function createReducer(anewStore, userReducer, persist) {
    var name = anewStore.name,
        initalState = anewStore.state;


    var baseReducer = function baseReducer(reduxState) {
        var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
            _ref$type = _ref.type,
            type = _ref$type === undefined ? '' : _ref$type,
            _ref$payload = _ref.payload,
            payload = _ref$payload === undefined ? [] : _ref$payload,
            _ref$state = _ref.state,
            globalState = _ref$state === undefined ? {} : _ref$state;

        var action = (0, _toAnewAction2.default)(type);
        var storeName = action[0];
        var reducerName = action[1];

        switch (storeName) {
            case _actionTypes.PREFIX:
                switch (reducerName) {
                    case _actionTypes.RESET:
                        anewStore.state = initalState;

                        break;
                    case _actionTypes.BATCH:
                        var _a = payload;

                        var _f = function _f(batch) {
                            baseReducer(reduxState, batch);
                        };

                        for (var _i = 0; _i < _a.length; _i++) {
                            _f(_a[_i], _i, _a);
                        }

                        undefined;

                        break;
                }
            case _actionTypes.PERSIST:
                switch (reducerName) {
                    case _actionTypes.REHYDRATE:
                        initalState = payload[name];
                        anewStore.setState(initalState);

                        break;
                }
            default:
                var isStore = name === storeName;
                var currentReducer = isStore ? anewStore.reducers : anewStore.reducers[storeName];

                if (!!currentReducer && typeof currentReducer[reducerName] === 'function') {
                    return anewStore.setState(currentReducer[reducerName].apply(currentReducer, [anewStore.state].concat(_toConsumableArray(!isStore ? [globalState[storeName]].concat(_toConsumableArray(payload)) : payload))));
                }

                break;
        }

        return anewStore.state;
    };

    return (0, _composeReducers2.default)(anewStore, persist ? (0, _reduxPersist.persistReducer)((0, _createPersistConfig2.default)(persist, name), baseReducer) : baseReducer, userReducer);
}