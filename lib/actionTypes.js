export var DELIMITER = '@@';
export var SEPERATOR = ':';
export var PREFIX = 'anew';
export var BATCH = 'BATCH';
export var RESET = 'RESET';
export var PERSIST = 'persist';
export var REHYDRATE = 'REHYDRATE';
export default {
  BATCH: "" + DELIMITER + PREFIX + SEPERATOR + BATCH,
  RESET: "" + DELIMITER + PREFIX + SEPERATOR + RESET
};