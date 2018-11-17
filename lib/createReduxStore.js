'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.default = createReduxStore;

var _redux = require('redux');

var _reduxPersist = require('redux-persist');

/**
 * Create Redux Store with Third Party Extensions
 *
 * @param  {Function}       reducer Reducer Function
 * @param  {Any}            state     Store Initial State
 * @param  {Function}       enhancer  Redux Store Enhancer
 * @param  {Object|Boolean} persist   Persist Conifg
 * @return {Object}         Anew Store Object
 */
function createReduxStore(reducer, state, enhancer, persist) {
    var reduxStore = (0, _redux.createStore)(reducer, state, enhancer);

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