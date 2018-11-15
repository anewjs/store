'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
var DELIMITER = exports.DELIMITER = '@@';

var SEPERATOR = exports.SEPERATOR = ':';

var PREFIX = exports.PREFIX = 'anew';

var BATCH = exports.BATCH = 'BATCH';

var RESET = exports.RESET = 'RESET';

var PERSIST = exports.PERSIST = 'persist';

var REHYDRATE = exports.REHYDRATE = 'REHYDRATE';

exports.default = {
    BATCH: '' + DELIMITER + PREFIX + SEPERATOR + BATCH,
    RESET: '' + DELIMITER + PREFIX + SEPERATOR + RESET
};