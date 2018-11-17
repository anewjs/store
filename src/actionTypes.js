export const DELIMITER = '@@'

export const SEPERATOR = ':'

export const PREFIX = 'anew'

export const BATCH = 'BATCH'

export const RESET = 'RESET'

export const PERSIST = 'persist'

export const REHYDRATE = 'REHYDRATE'

export default {
    BATCH: `${DELIMITER}${PREFIX}${SEPERATOR}${BATCH}`,
    RESET: `${DELIMITER}${PREFIX}${SEPERATOR}${RESET}`,
}
