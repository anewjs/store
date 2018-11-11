'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.default = createAnewSelector;

var _reselect = require('reselect');

function createAnewSelector(anewStore, reduxStore) {
    return function createAnewSelectorWrapper() {
        for (var _len = arguments.length, payload = Array(_len), _key = 0; _key < _len; _key++) {
            payload[_key] = arguments[_key];
        }

        var selector = payload[0];
        var payloadLen = payload.length;

        switch (typeof selector === 'undefined' ? 'undefined' : _typeof(selector)) {
            case 'string':
                var propName = selector;
                var defaultValue = payload[1];

                var propSelector = function propSelector(state) {
                    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                        _ref$propName = _ref[propName],
                        propValue = _ref$propName === undefined ? defaultValue : _ref$propName;

                    function propSelectorBinded(state) {
                        var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
                            _ref2$propName = _ref2[propName],
                            propValue = _ref2$propName === undefined ? defaultValue : _ref2$propName;

                        return propValue;
                    }

                    return {
                        ref: propSelectorBinded,
                        value: propValue
                    };
                };

                return propSelector;
            case 'object':
            case 'function':
                if (payloadLen === 1) {
                    var simpleSelector = function simpleSelector() {
                        var simpleSelectorBinded = void 0;

                        if (reduxStore.anew.core) {
                            simpleSelectorBinded = function simpleSelectorBinded() {
                                for (var _len2 = arguments.length, payload = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                                    payload[_key2] = arguments[_key2];
                                }

                                return selector.apply(undefined, [anewStore.state, reduxStore.anew.core.getState()].concat(payload));
                            };
                        } else {
                            simpleSelectorBinded = function simpleSelectorBinded() {
                                for (var _len3 = arguments.length, payload = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                                    payload[_key3] = arguments[_key3];
                                }

                                return selector.apply(undefined, [anewStore.state].concat(payload));
                            };
                        }

                        return {
                            ref: simpleSelectorBinded,
                            value: simpleSelectorBinded.apply(undefined, arguments)
                        };
                    };

                    return simpleSelector;
                } else if (payloadLen > 1) {
                    var memoizedSelector = function memoizedSelector(props) {
                        var memoizedSelectorBinded = void 0;

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
                    };

                    var _selector = _reselect.createSelector.apply(undefined, payload);

                    return memoizedSelector;
                }
            default:
                return function () {
                    return undefined;
                };
        }
    };
}