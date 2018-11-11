export const DELIMITER = '@@'

export const SEPERATOR = ':'

export const PREFIX = `${DELIMITER}anew`

export const BATCH = 'BATCH'

export const RESET = 'RESET'

export const PERSIST = 'persist'

export const REHYDRATE = 'REHYDRATE'

export default {
    BATCH: `${PREFIX}${SEPERATOR}${BATCH}`,
    RESET: `${PREFIX}${SEPERATOR}${RESET}`,
}
