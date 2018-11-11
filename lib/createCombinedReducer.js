"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createCombinedReducer;
function createCombinedReducer(anewStore, reduxReducer) {
    return function (reduxState, action) {
        action.state = anewStore.state;

        return anewStore.setState(reduxReducer(reduxState, action));
    };
}