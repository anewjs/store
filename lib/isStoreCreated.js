"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = isStoreCreated;
function isStoreCreated(store) {
    return !!store.getState;
}