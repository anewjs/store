import { createSelector } from 'reselect'
import produce from 'immer'

function assert(condition, msg) {
    if (!condition) throw new Error(`[@anew] ${msg}`)
}

export default class Store {
    constructor(options) {
        if (options) {
            this.use(options)
        }
    }

    use({
        state = this.state || {},
        reducers = this.reducers || {},
        mutations = this.mutations || {},
        actions = this.actions || {},
        getters = this.getters || {},
        selectors = this.selectors || {},
        listeners = this.listeners || {},
        modules = this.modules,
    } = {}) {
        if (process.env.NODE_ENV !== 'production') {
            if (Object.keys(mutations).length) {
                const stateType = typeof state

                assert(
                    stateType === 'object',
                    `state must be an object to use mutations (state: ${stateType})`
                )
            }
        }

        // Assign Options
        this.state = state
        this.mutations = mutations
        this.reducers = reducers
        this.actions = actions
        this.getters = getters
        this.selectors = selectors
        this.listeners = listeners
        this.modules = modules

        // Initialize Listeners
        this._subscriptions = []
        this._nextSubscriptions = this._subscriptions
        this._listeners = {}
        this._stateHasChanged = false

        // Initialize Store
        this._initStore()

        // Install Options (From, To, ..args)
        this._installModules(modules, this)
        this._installGetters(getters, this.get)
        this._installSelectors(selectors, this.select, { get: this.get, select: this.select })
        this._installMutations(mutations, this.commit, this.state, this.get)
        this._installReducers(reducers, this.commit, this.state, {}, this.get)
        this._installActions(actions, this.dispatch, this)
        this._installListeners(this.listeners, this._listeners, this.state, this)
    }

    _initStore() {
        this.select = {}
        this.stage.commit = this._stageCommit
    }

    _installModules(modules = {}, storage) {
        Object.entries(modules).forEach(([moduleName, module]) => {
            if (module.state === undefined) module.state = {}
            if (process.env.NODE_ENV !== 'production') {
                if (Object.keys(module.mutations).length) {
                    const stateType = typeof module.state

                    assert(
                        stateType === 'object',
                        `state must be an object to use mutations (state: ${stateType}, for: ${moduleName})`
                    )
                }
            }

            Object.keys(module).forEach(type => {
                switch (type) {
                    case 'modules':
                        this._installModules(module.modules, module)
                        break
                    default:
                        if (!storage[type]) storage[type] = {}

                        storage[type][moduleName] = module[type]
                        break
                }
            })
        })
    }

    _installGetters(getters, storeGet) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    storeGet[getName] = (...args) => get(storeGet(), ...args)
                    break
                case 'object':
                    storeGet[getName] = () => storeGet()[getName]
                    this._installGetters(get, storeGet[getName])
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

    _installMutations(mutations, storage, state, getState, prefix = '') {
        Object.entries(mutations).forEach(([mutationName, mutation]) => {
            const path = prefix + mutationName

            switch (typeof mutation) {
                case 'function':
                    storage[mutationName] = (...args) => {
                        state = Object.assign(
                            state,
                            produce(state, draft => mutation(draft, ...args))
                        )
                        this._notifiyListeners(path, ...args)
                        this._notifiySubscriptions()
                        return state
                    }
                    break
                case 'object':
                    storage[mutationName] = {}

                    this._installMutations(
                        mutation,
                        storage[mutationName],
                        state[mutationName],
                        () => getState()[mutationName],
                        path + '/'
                    )
                    break
            }
        })
    }

    _installReducers(reducers, storage, state, parentState, getState, prefix = '', stateKey) {
        Object.entries(reducers).forEach(([reducerName, reducer]) => {
            const path = prefix + reducerName

            switch (typeof reducer) {
                case 'function':
                    if (typeof state !== 'object' && !stateKey) {
                        // if root state is primitive value
                        storage[reducerName] = (...args) => {
                            const change = reducer(this.state, ...args)
                            this._stateHasChanged = change && change !== this.state

                            if (this._stateHasChanged) {
                                this.state = change
                            }

                            this._notifiyListeners(path, ...args)
                            this._notifiySubscriptions()
                            return this.state
                        }
                    } else if (stateKey) {
                        // if target state is primitive value
                        storage[reducerName] = (...args) => {
                            const change = reducer(getState(), ...args)
                            this._stateHasChanged = change && change !== parentState[stateKey]

                            if (this._stateHasChanged) {
                                parentState[stateKey] = change
                            }

                            this._notifiyListeners(path, ...args)
                            this._notifiySubscriptions()
                            return parentState[stateKey]
                        }
                    } else {
                        // if target state is object
                        storage[reducerName] = (...args) => {
                            const change = reducer(getState(), ...args)
                            this._stateHasChanged = change && change !== state

                            if (this._stateHasChanged) {
                                state = Object.assign(state, change)
                            }

                            this._notifiyListeners(path, ...args)
                            this._notifiySubscriptions()
                            return state
                        }
                    }
                    break
                case 'object':
                    storage[reducerName] = {}
                    const childState = state[reducerName]

                    this._installReducers(
                        reducer,
                        storage[reducerName],
                        childState,
                        state,
                        () => getState()[reducerName],
                        path + '/',
                        typeof childState !== 'object' && path
                    )
                    break
            }
        })
    }

    _installActions(actions, storage, store, prefix = '') {
        Object.entries(actions).forEach(([actionName, action]) => {
            const path = prefix + actionName

            switch (typeof action) {
                case 'function':
                    storage[actionName] = (...args) => action(store, ...args)
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
                        path + '/'
                    )
                    break
            }
        })
    }

    _installListeners(listeners, storage, state, store, prefix = '') {
        const listenerKeys = Object.keys(listeners)

        for (let i = 0, listenersLen = listenerKeys.length; i < listenersLen; i++) {
            const contextName = listenerKeys[i]
            const context = listeners[contextName]

            const contextKeys = Object.keys(context)
            const contextStore = {
                select: store.select[contextName] || {},
                get: store.get[contextName] || {},
                dispatch: store.dispatch[contextName] || {},
                commit: store.commit[contextName] || {},
                stage: this.stage,
                core: this,
            }

            for (let j = 0, contextLen = contextKeys.length; j < contextLen; j++) {
                const targetName = contextKeys[j]
                const target = context[targetName]

                if (typeof target !== 'object') continue

                const targetKeys = Object.keys(target)
                const targetState = state[targetName]

                for (let k = 0, targetLen = targetKeys.length; k < targetLen; k++) {
                    const reducerName = targetKeys[k]
                    const reducer = target[reducerName]

                    switch (typeof reducer) {
                        case 'function':
                            const prevListener = context[`${prefix}${targetName}/${reducerName}`]
                            const prevListenerBinded = prevListener && prevListener.bind({})

                            if (prevListenerBinded) {
                                storage[`${prefix}${targetName}/${reducerName}`] = (...args) => {
                                    prevListenerBinded(...args)
                                    return reducer(contextStore, targetState, ...args)
                                }
                            } else {
                                storage[`${prefix}${targetName}/${reducerName}`] = (...args) => {
                                    return reducer(contextStore, targetState, ...args)
                                }
                            }

                            break
                        case 'object':
                            this._installListeners(
                                context,
                                storage,
                                state[contextName],
                                contextStore,
                                contextName + '/'
                            )
                            break
                    }
                }
            }
        }
    }

    /**
    | ------------------
    | Store Methods
    | ------------------
    | Exposed API
    |
    */

    subscribe = listener => {
        if (typeof listener !== 'function') {
            throw new Error('Expected the listener to be a function.')
        }

        let isSubscribed = true

        this._ensureCanMutateNextListeners()
        this._nextSubscriptions.push(listener)

        const unsubscribe = () => {
            if (!isSubscribed) {
                return
            }

            isSubscribed = false

            this._ensureCanMutateNextListeners()
            const index = this._nextSubscriptions.indexOf(listener)
            this._nextSubscriptions.splice(index, 1)
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
    }

    /**
     | ------------------
     | Internal API
     | ------------------
     |
     */

    _stageCommit = () => {
        if (this.isStaging) {
            this.isStaging = false
            this._notifiySubscriptions()
        }
    }

    _ensureCanMutateNextListeners = () => {
        if (this._nextSubscriptions === this._subscriptions) {
            this._nextSubscriptions = this._subscriptions.slice()
        }
    }

    _notifiySubscriptions = () => {
        if (!this.isStaging && this._stateHasChanged) {
            this._stateHasChanged = false
            const listeners = (this._subscriptions = this._nextSubscriptions)

            listeners.forEach(listener => listener())
        }
    }

    _notifiyListeners = (path, ...args) => {
        const listener = this._listeners[path]

        if (listener) {
            listener(...args)
        }
    }
}
