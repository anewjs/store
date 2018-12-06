import { persistReducer } from 'redux-persist';
import { PERSIST, REHYDRATE, PREFIX, RESET, BATCH } from './actionTypes';
import composeReducers from './composeReducers';
import createPersistConfig from './createPersistConfig';
import toAnewAction from './toAnewAction';
export default function createReducer(anewStore, userReducer, persist) {
  var name = anewStore.name,
      initalState = anewStore.state;

  var baseReducer = function baseReducer(reduxState, _temp) {
    var _ref = _temp === void 0 ? {} : _temp,
        _ref$type = _ref.type,
        type = _ref$type === void 0 ? '' : _ref$type,
        _ref$payload = _ref.payload,
        payload = _ref$payload === void 0 ? [] : _ref$payload,
        _ref$state = _ref.state,
        globalState = _ref$state === void 0 ? {} : _ref$state;

    var action = toAnewAction(type);
    var storeName = action[0];
    var reducerName = action[1];

    switch (storeName) {
      case PREFIX:
        switch (reducerName) {
          case RESET:
            anewStore.state = initalState;
            break;

          case BATCH:
            payload.forEach(function (batch) {
              baseReducer(reduxState, batch);
            });
            break;
        }

      case PERSIST:
        switch (reducerName) {
          case REHYDRATE:
            initalState = payload[name];
            anewStore.setState(initalState);
            break;
        }

      default:
        var isStore = name === storeName;
        var currentReducer = isStore ? anewStore.reducers : anewStore.reducers[storeName];

        if (!!currentReducer && typeof currentReducer[reducerName] === 'function') {
          return anewStore.setState(currentReducer[reducerName].apply(currentReducer, [anewStore.state].concat(!isStore ? [globalState[storeName]].concat(payload) : payload)));
        }

        break;
    }

    return anewStore.state;
  };

  return composeReducers(anewStore, persist ? persistReducer(createPersistConfig(persist, name), baseReducer) : baseReducer, userReducer);
}