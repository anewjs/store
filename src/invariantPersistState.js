import invariant from 'invariant'

import isPlainObject from './isPlainObject'

export default function invariantPersistState(name, state, persist) {
    if (persist) {
        invariant(
            isPlainObject(state),
            `Persist requires a plain object state. Please wrap ` +
                `the current state in "${name}" with a plain object or turn persist off.`
        )
    }
}
