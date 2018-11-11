import persistStorage from 'redux-persist/lib/storage'

/**
 * Convert true presits to config object
 */
export default function createPersistConfig(persist, name) {
    switch (typeof persist) {
        case 'boolean':
            if (persist) {
                persist = {
                    key: name,
                    storage: persistStorage,
                }
            }

            break
        case 'object':
            persist = {
                storage: persistStorage,
                ...persist,
                key: name,
            }

            break
    }

    return persist
}
