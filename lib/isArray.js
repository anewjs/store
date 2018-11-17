'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = isArray;
function isArray(obj) {
    if (typeof Array.isArray === 'undefined') {
        Array.isArray = function (obj) {
            return Object.prototype.toString.call(obj) === '[object Array]';
        };
    }

    return Array.isArray(obj);
}