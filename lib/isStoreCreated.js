export default function isStoreCreated(store) {
  return !!(store && store.getState);
}