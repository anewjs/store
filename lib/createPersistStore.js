'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createPersistStore;

var _reduxPersist = require('redux-persist');

/**
 * Create persist store as a property inside the redux store
 * @return { Object } Redux Store Object Shape
 */
function createPersistStore(persist, reduxStore) {
    if (persist) {
        var persistor = (0, _reduxPersist.persistStore)(reduxStore);
        var dispatch = persistor.dispatch,
            getState = persistor.getState;


        reduxStore.persistor = persistor;
        reduxStore.getState.persistor = getState;
        reduxStore.dispatch.persistor = dispatch;
        reduxStore.dispatch.persistor = Object.assign(reduxStore.dispatch.persistor, {
            flush: persistor.flush,
            pause: persistor.pause,
            persist: persistor.flush,
            purge: persistor.purge
        });
    }

    return reduxStore;
}