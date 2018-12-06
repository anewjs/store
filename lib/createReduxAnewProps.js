export default function createReduxAnewProps(_ref, reducer) {
  var name = _ref.name,
      batches = _ref.batches;
  return {
    name: name,
    reducer: reducer,
    getBatches: function getBatches() {
      return batches;
    }
  };
}