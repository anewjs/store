import { createSelector } from 'reselect'

export default class Store {
    constructor(options) {
        if (options) {
            this.use(options)
        }
    }

    use({
        state = this.state || {},
        reducers = this.reducers || {},
        actions = this.actions || {},
        getters = this.getters || {},
        selectors = this.selectors || {},
        on = this.on || {},
        modules = this.modules,
    } = {}) {
        // Nested Default
        if (!on.dispatch) on.dispatch = () => null
        if (!on.commit) on.commit = () => null
        if (!on.update) on.update = () => null

        // Assign Options
        this.state = state
        this.reducers = reducers
        this.actions = actions
        this.getters = getters
        this.selectors = selectors
        this.on = on
        this.modules = modules

        // Initialize Store
        this.initStore()

        // Install Options (From, To, ..args)
        this.installModules(modules, this)
        this.installGetters(getters, this.get, this.get)
        this.installSelectors(selectors, this.select, this)
        this.installReducers(reducers, this.commit, {}, this.state, {}, this.get)
        this.installActions(actions, this.dispatch, this)
    }

    initStore() {
        this.select = {}
        this.stage.commit = this.stageCommit
    }

    installModules(modules = {}, storage) {
        Object.entries(modules).forEach(([moduleName, module]) => {
            if (module.state === undefined) module.state = {}

            Object.keys(module).forEach(type => {
                switch (type) {
                    case 'modules':
                        this.installModules(module.modules, module)
                        break
                    default:
                        storage[type][moduleName] = module[type]
                        break
                }
            })
        })
    }

    installGetters(getters, storage, getState) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    storage[getName] = (...args) => get(getState(), ...args)
                    break
                case 'object':
                    storage[getName] = () => getState()[getName]
                    this.installGetters(get, storage[getName], storage[getName])
                    break
            }
        })
    }

    installSelectors(selectors, storage, store) {
        Object.entries(selectors).forEach(([selectorName, selector]) => {
            switch (typeof selector) {
                case 'function':
                    const memoizedSelector = createSelector(...selector(store))
                    storage[selectorName] = () => memoizedSelector(store.get())
                    break
                case 'object':
                    storage[selectorName] = {}

                    this.installSelectors(selector, storage[selectorName], {
                        get: store.get[selectorName],
                        select: store.select[selectorName],
                        core: this,
                    })
                    break
            }
        })
    }

    installReducers(
        reducers,
        storage,
        parentReducers,
        state,
        parentState,
        getState,
        prefix = '',
        isLevelUp
    ) {
        Object.entries(reducers).forEach(([reducerName, reducer]) => {
            if (reducerName === 'on') return

            switch (typeof reducer) {
                case 'function':
                    const path = prefix + reducerName

                    if (isLevelUp) {
                        const stateKey = prefix.replace(/\/$/, '')

                        storage[reducerName] = (...args) => {
                            this.on.commit(path, args)
                            this.updateState(parentState, reducer(getState(), ...args), stateKey)
                            this.callPathInSiblingReducers(
                                parentReducers,
                                path,
                                parentState[stateKey],
                                parentState,
                                ...args
                            )
                            return parentState[stateKey]
                        }
                    } else {
                        storage[reducerName] = (...args) => {
                            this.on.commit(path, args)
                            this.updateState(state, reducer(getState(), ...args))
                            this.callPathInSiblingReducers(
                                parentReducers,
                                path,
                                state,
                                parentState,
                                ...args
                            )
                            return state
                        }
                    }
                    break
                case 'object':
                    storage[reducerName] = {}
                    this.installReducers(
                        reducer,
                        storage[reducerName],
                        reducers,
                        state[reducerName],
                        state,
                        () => getState()[reducerName],
                        prefix + reducerName + '/',
                        typeof state[reducerName] !== 'object'
                    )
                    break
            }
        })
    }

    installActions(actions, storage, store, prefix = '') {
        Object.entries(actions).forEach(([actionName, action]) => {
            switch (typeof action) {
                case 'function':
                    const path = prefix + actionName

                    storage[actionName] = (...args) => {
                        this.on.dispatch(path, args)

                        return action(store, ...args)
                    }
                    break
                case 'object':
                    storage[actionName] = {}
                    this.installActions(
                        action,
                        storage[actionName],
                        {
                            select: store.select[actionName],
                            get: store.get[actionName],
                            dispatch: store.dispatch[actionName],
                            commit: store.commit[actionName],
                            stage: this.stage,
                            core: this,
                        },
                        prefix + actionName + '/'
                    )
                    break
            }
        })
    }

    /**
    | ------------------
    | Store Methods
    | ------------------
    | Exposed API
    |
    */

    get = () => {
        return this.state
    }

    dispatch = (actionPath, ...args) => {
        const actionPaths = actionPath.split('/')
        const lastActionIndex = actionPaths.length - 1

        return actionPaths.reduce((actionParent, path, i) => {
            if (i === lastActionIndex) {
                const action = actionParent[path]

                return typeof action === 'function' && action(...args)
            }

            return actionParent[path]
        }, this.dispatch)
    }

    commit = (reducerPath, ...args) => {
        const reducerPaths = reducerPath.split('/')
        const lastReducerIndex = reducerPaths.length - 1

        return reducerPaths.reduce((reducerParent, path, i) => {
            if (i === lastReducerIndex) {
                const reducer = reducerParent[path]

                return typeof reducer === 'function' && reducer(...args)
            }

            return reducerParent[path]
        }, this.commit)
    }

    stage = () => {
        this.isStaging = true
        this.on.commit('@anew/STAGE_START')
    }

    stageCommit = () => {
        this.isStaging = false
        this.on.commit('@anew/STAGE_COMPLETE')
    }

    /**
    | ------------------
    | Internal API
    | ------------------
    |
    */

    callPathInSiblingReducers = (reducers, path, state, parentState, ...args) => {
        const paths = path.split('/')

        if (paths.length === 2) {
            const targetStoreName = paths[0]
            const targetReducerName = paths[1]

            Object.entries(reducers).forEach(([reducerName, reducer]) => {
                if (reducer.on) {
                    const targetStore = reducer.on[targetStoreName]
                    const targetReducer = targetStore && targetStore[targetReducerName]

                    if (typeof targetReducer === 'function') {
                        this.updateState(
                            parentState[reducerName],
                            targetReducer(parentState[reducerName], state, ...args)
                        )
                    }
                }
            })
        }
    }

    updateState = (state, change, stateKey) => {
        if (change && change !== state) {
            if (stateKey) {
                this.on.update(state[stateKey])

                if (typeof state[stateKey] === 'object') {
                    return (state[stateKey] = Object.assign(state[stateKey], change))
                } else {
                    return (state[stateKey] = change)
                }
            } else {
                this.on.update(state)

                if (typeof state === 'object') {
                    return (state = Object.assign(state, change))
                } else {
                    return (state = change)
                }
            }
        }

        return state
    }
}
