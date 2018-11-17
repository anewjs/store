'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createBatchMiddleware;

var _actionTypes = require('./actionTypes');

var _actionTypes2 = _interopRequireDefault(_actionTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createBatchMiddleware(getBatches) {
    return function batchMiddleware(_ref) {
        var dispatch = _ref.dispatch;

        return function (next) {
            return function (action) {
                var batches = getBatches();
                var len = batches.length;

                if (action && action.type !== _actionTypes2.default.BATCH && !!len) {
                    dispatch({
                        type: _actionTypes2.default.BATCH,
                        payload: batches.splice(0, len)
                    });
                }

                return next(action);
            };
        };
    };
}