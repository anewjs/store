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

        // Initialize Listeners
        this._listeners = []
        this._nextListeners = this._listeners

        // Initialize Store
        this._initStore()

        // Install Options (From, To, ..args)
        this._installModules(modules, this)
        this._installGetters(getters, this.get, this.get)
        this._installSelectors(selectors, this.select, this)
        this._installReducers(reducers, this.commit, {}, this.state, {}, this.get)
        this._installActions(actions, this.dispatch, this)
    }

    _initStore() {
        this.select = {}
        this.stage.commit = this._stageCommit
    }

    _installModules(modules = {}, storage) {
        Object.entries(modules).forEach(([moduleName, module]) => {
            if (module.state === undefined) module.state = {}

            Object.keys(module).forEach(type => {
                switch (type) {
                    case 'modules':
                        this._installModules(module.modules, module)
                        break
                    default:
                        storage[type][moduleName] = module[type]
                        break
                }
            })
        })
    }

    _installGetters(getters, storage, getState) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    storage[getName] = (...args) => get(getState(), ...args)
                    break
                case 'object':
                    storage[getName] = () => getState()[getName]
                    this._installGetters(get, storage[getName], storage[getName])
                    break
            }
        })
    }

    _installSelectors(selectors, storage, store) {
        Object.entries(selectors).forEach(([selectorName, selector]) => {
            switch (typeof selector) {
                case 'function':
                    const memoizedSelector = createSelector(...selector(store))
                    storage[selectorName] = () => memoizedSelector(store.get())
                    break
                case 'object':
                    storage[selectorName] = {}

                    this._installSelectors(selector, storage[selectorName], {
                        get: store.get[selectorName],
                        select: store.select[selectorName],
                        core: this,
                    })
                    break
            }
        })
    }

    _installReducers(
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
                            this._updateState(parentState, reducer(getState(), ...args), stateKey)
                            this._callPathInSiblingReducers(
                                parentReducers,
                                path,
                                parentState[stateKey],
                                parentState,
                                ...args
                            )
                            this._notifiyListeners()
                            return parentState[stateKey]
                        }
                    } else {
                        storage[reducerName] = (...args) => {
                            this.on.commit(path, args)
                            this._updateState(state, reducer(getState(), ...args))
                            this._callPathInSiblingReducers(
                                parentReducers,
                                path,
                                state,
                                parentState,
                                ...args
                            )
                            this._notifiyListeners()
                            return state
                        }
                    }
                    break
                case 'object':
                    storage[reducerName] = {}
                    this._installReducers(
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

    _installActions(actions, storage, store, prefix = '') {
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
                    this._installActions(
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

    subscribe = listener => {
        if(typeof listener !== 'function') {
            throw new Error('Expected the listener to be a function.')
        }

        let isSubscribed = true

        this._ensureCanMutateNextListeners()
        this._nextListeners.push(listener)

        const unsubscribe = () => {
            if (!isSubscribed) {
                return
            }

            isSubscribed = false

            this._ensureCanMutateNextListeners()
            const index = this._nextListeners.indexOf(listener)
            this._nextListeners.splice(index, 1)
        }

        return unsubscribe
    }

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

    /**
     | ------------------
     | Internal API
     | ------------------
     |
     */

    _stageCommit = () => {
        this.isStaging = false
        this.on.commit('@anew/STAGE_COMPLETE')
        this._notifiyListeners()
    }

    _ensureCanMutateNextListeners = () => {
        if (this._nextListeners === this._listeners) {
            this._nextListeners = this._listeners.slice()
        }
    }

    _notifiyListeners = () => {
        if (!this.isStaging) {
            const listeners = (this._listeners = this._nextListeners)

            listeners.forEach(listener => listener())
        }
    }

    _callPathInSiblingReducers = (reducers, path, state, parentState, ...args) => {
        const paths = path.split('/')

        if (paths.length === 2) {
            const targetStoreName = paths[0]
            const targetReducerName = paths[1]

            Object.entries(reducers).forEach(([reducerName, reducer]) => {
                if (reducer.on) {
                    const targetStore = reducer.on[targetStoreName]
                    const targetReducer = targetStore && targetStore[targetReducerName]

                    if (typeof targetReducer === 'function') {
                        this._updateState(
                            parentState[reducerName],
                            targetReducer(parentState[reducerName], state, ...args)
                        )
                    }
                }
            })
        }
    }

    _updateState = (state, change, stateKey) => {
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
