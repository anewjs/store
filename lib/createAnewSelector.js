import { createSelector } from 'reselect';
export default function createAnewSelector(anewStore, reduxStore) {
  return function createAnewSelectorWrapper() {
    var selector = arguments.length <= 0 ? undefined : arguments[0];
    var payloadLen = arguments.length;

    switch (typeof selector) {
      case 'string':
        var propName = selector;
        var defaultValue = arguments.length <= 1 ? undefined : arguments[1];

        function propSelector(state, _temp) {
          var _ref = _temp === void 0 ? {} : _temp,
              _ref$propName = _ref[propName],
              propValue = _ref$propName === void 0 ? defaultValue : _ref$propName;

          function propSelectorBinded(state, _temp2) {
            var _ref2 = _temp2 === void 0 ? {} : _temp2,
                _ref2$propName = _ref2[propName],
                propValue = _ref2$propName === void 0 ? defaultValue : _ref2$propName;

            return propValue;
          }

          return {
            ref: propSelectorBinded,
            value: propValue
          };
        }

        return propSelector;

      case 'object':
      case 'function':
        if (payloadLen === 1) {
          function simpleSelector() {
            var simpleSelectorBinded;

            if (reduxStore.anew.core) {
              simpleSelectorBinded = function simpleSelectorBinded() {
                for (var _len = arguments.length, payload = new Array(_len), _key = 0; _key < _len; _key++) {
                  payload[_key] = arguments[_key];
                }

                return selector.apply(void 0, [anewStore.state, reduxStore.anew.core.getState()].concat(payload));
              };
            } else {
              simpleSelectorBinded = function simpleSelectorBinded() {
                for (var _len2 = arguments.length, payload = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                  payload[_key2] = arguments[_key2];
                }

                return selector.apply(void 0, [anewStore.state].concat(payload));
              };
            }

            return {
              ref: simpleSelectorBinded,
              value: simpleSelectorBinded.apply(void 0, arguments)
            };
          }

          return simpleSelector;
        } else if (payloadLen > 1) {
          var _selector = createSelector.apply(void 0, arguments);

          function memoizedSelector(props) {
            var memoizedSelectorBinded;

            if (reduxStore.anew.core) {
              memoizedSelectorBinded = function memoizedSelectorBinded(props) {
                return _selector(reduxStore.anew.core.getState(), props);
              };
            } else {
              memoizedSelectorBinded = function memoizedSelectorBinded(props) {
                return _selector(anewStore.state, props);
              };
            }

            return {
              ref: memoizedSelectorBinded,
              value: memoizedSelectorBinded(props)
            };
          }

          return memoizedSelector;
        }

      default:
        return function () {
          return undefined;
        };
    }
  };
}