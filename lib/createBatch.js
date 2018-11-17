'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createBatch;

var _actionTypes = require('./actionTypes');

var _actionTypes2 = _interopRequireDefault(_actionTypes);

var _isPlainObject = require('./isPlainObject');

var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function createBatch(reduxStore, type) {
    var callReducer = void 0;

    switch (type) {
        case 'combined':
            callReducer = function callReducer(payload) {
                var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [],
                    storeName = _ref[0],
                    batchName = _ref[1];

                var storeBatch = reduxStore.dispatch.batch[storeName];

                if (!!storeBatch && typeof storeBatch[batchName] === 'function') {
                    storeBatch[batchName].apply(storeBatch, _toConsumableArray(payload));
                }
            };

            break;
        default:
            callReducer = function callReducer(payload) {
                var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [],
                    longSyntax = _ref2[0],
                    shortSyntax = _ref2[1];

                if (typeof batchBuilder === 'function') {
                    batchBuilder.apply(undefined, _toConsumableArray(payload));
                } else if (longSyntax) {
                    reduxStore.anew.getBatches().push({
                        type: longSyntax + ':' + shortSyntax,
                        payload: payload
                    });
                }
            };

            break;
    }

    var batch = function batch() {
        var batches = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

        if ((0, _isPlainObject2.default)(batches)) {
            var _type = batches.type,
                _batches$payload = batches.payload,
                payload = _batches$payload === undefined ? [] : _batches$payload;

            var data = _type.split(':');

            callReducer(payload, data);
        } else {
            for (var i = 0, batchLen = batches.length; i < batchLen; i++) {
                var _batches$i = batches[i],
                    _type2 = _batches$i.type,
                    _batches$i$payload = _batches$i.payload,
                    _payload = _batches$i$payload === undefined ? [] : _batches$i$payload;

                var _data = _type2.split(':');

                callReducer(_payload, _data);
            }
        }

        return batches;
    };

    batch.done = function () {
        var batches = reduxStore.anew.getBatches();
        var length = batches.length;


        if (!!length) {
            return reduxStore.dispatch({
                type: _actionTypes2.default.BATCH,
                payload: batches.splice(0, length)
            });
        }
    };

    return batch;
}