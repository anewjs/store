import ActionTypes from './actionTypes';
import isPlainObject from './isPlainObject';
export default function createBatch(reduxStore, type) {
  var callReducer;

  switch (type) {
    case 'combined':
      callReducer = function callReducer(payload, _temp) {
        var _ref = _temp === void 0 ? [] : _temp,
            storeName = _ref[0],
            batchName = _ref[1];

        var storeBatch = reduxStore.dispatch.batch[storeName];

        if (!!storeBatch && typeof storeBatch[batchName] === 'function') {
          storeBatch[batchName].apply(storeBatch, payload);
        }
      };

      break;

    default:
      callReducer = function callReducer(payload, _temp2) {
        var _ref2 = _temp2 === void 0 ? [] : _temp2,
            longSyntax = _ref2[0],
            shortSyntax = _ref2[1];

        if (typeof batchBuilder === 'function') {
          batchBuilder.apply(void 0, payload);
        } else if (longSyntax) {
          reduxStore.anew.getBatches().push({
            type: longSyntax + ":" + shortSyntax,
            payload: payload
          });
        }
      };

      break;
  }

  var batch = function batch(batches) {
    if (batches === void 0) {
      batches = [];
    }

    if (isPlainObject(batches)) {
      var _batches = batches,
          _type = _batches.type,
          _batches$payload = _batches.payload,
          payload = _batches$payload === void 0 ? [] : _batches$payload;

      var data = _type.split(':');

      callReducer(payload, data);
    } else {
      for (var i = 0, batchLen = batches.length; i < batchLen; i++) {
        var _batches$i = batches[i],
            _type2 = _batches$i.type,
            _batches$i$payload = _batches$i.payload,
            _payload = _batches$i$payload === void 0 ? [] : _batches$i$payload;

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
        type: ActionTypes.BATCH,
        payload: batches.splice(0, length)
      });
    }
  };

  return batch;
}