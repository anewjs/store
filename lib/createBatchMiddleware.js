import ActionTypes from './actionTypes';
export default function createBatchMiddleware(getBatches) {
  return function batchMiddleware(_ref) {
    var dispatch = _ref.dispatch;
    return function (next) {
      return function (action) {
        var batches = getBatches();
        var len = batches.length;

        if (action && action.type !== ActionTypes.BATCH && !!len) {
          dispatch({
            type: ActionTypes.BATCH,
            payload: batches.splice(0, len)
          });
        }

        return next(action);
      };
    };
  };
}