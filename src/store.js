import { createSelector } from 'reselect'

import isPlainObject from './isPlainObject'
import assert from './assert'

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
        listeners = this.listeners || {},
        modules = this.modules,
    } = {}) {
        // Assign Options
        this.state = typeof state === 'object' ? { ...state } : state
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
        this._installReducers(reducers, this.commit, this.state, this.get)
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
            if (!module.getters) module.getters = {}

            Object.keys(module).forEach(type => {
                switch (type) {
                    case 'modules':
                        this._installModules(module.modules, module)
                        break
                    default:
                        if (!storage[type]) storage[type] = {}

                        if (storage[type][moduleName]) {
                            storage[type][moduleName] = Object.assign(
                                {},
                                module[type],
                                storage[type][moduleName]
                            )
                        } else {
                            storage[type][moduleName] = module[type]
                        }

                        break
                }
            })
        })
    }

    _installGetters(getters, getState) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    getState[getName] = (...args) => get(getState(), ...args)
                    break
                case 'object':
                    getState[getName] = () => getState()[getName]
                    this._installGetters(get, getState[getName])
                    break
            }
        })
    }

    _installSelectors(selectors, storage, store) {
        Object.entries(selectors).forEach(([selectorName, selector]) => {
            switch (typeof selector) {
                case 'function':
                    storage[selectorName] = createSelector(...selector(store))
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
        stateRef,
        getState,
        prefix = '',
        propagate = typeof stateRef !== 'object'
            ? change => (this.state = change)
            : (change, containerName) => {
                  this.state = Object.assign(
                      {},
                      this.state,
                      containerName ? { [containerName]: change } : change
                  )

                  return this.state
              }
    ) {
        Object.entries(reducers).forEach(([reducerName, reducer]) => {
            const path = prefix + reducerName

            switch (typeof reducer) {
                case 'function':
                    storage[reducerName] = (...args) => {
                        const state = getState()
                        const change = reducer(state, ...args)
                        this._stateHasChanged = change !== undefined && change !== state

                        if (this._stateHasChanged) {
                            propagate(change)
                        }

                        this._notifiyListeners(path, getState(), ...args)
                        this._notifiySubscriptions()

                        return change
                    }
                    break
                case 'object':
                    storage[reducerName] = {}

                    const targetGetState = getState[reducerName]
                    const targetState = typeof stateRef === 'object' && stateRef[reducerName]
                    const objectInstance = isPlainObject(targetState) ? {} : []
                    const nextPropogation =
                        targetState && typeof targetState !== 'object'
                            ? change => propagate({ [reducerName]: change })
                            : (change, containerName) => {
                                  return propagate(
                                      Object.assign(
                                          objectInstance,
                                          targetGetState(),
                                          containerName ? { [containerName]: change } : change
                                      ),
                                      reducerName
                                  )
                              }

                    this._installReducers(
                        reducer,
                        storage[reducerName],
                        targetState,
                        targetGetState,
                        path + '/',
                        nextPropogation || propagate
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

                for (let k = 0, targetLen = targetKeys.length; k < targetLen; k++) {
                    const reducerName = targetKeys[k]
                    const reducer = target[reducerName]

                    switch (typeof reducer) {
                        case 'function':
                            const prevListener = context[`${prefix}${targetName}/${reducerName}`]
                            const prevListenerBinded = prevListener && prevListener.bind({})

                            if (prevListenerBinded) {
                                storage[`${prefix}${targetName}/${reducerName}`] = (
                                    targetState,
                                    ...args
                                ) => {
                                    prevListenerBinded(...args)
                                    return reducer(contextStore, targetState, ...args)
                                }
                            } else {
                                storage[`${prefix}${targetName}/${reducerName}`] = (
                                    targetState,
                                    ...args
                                ) => {
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

    _notifiyListeners = (path, change, ...args) => {
        const listener = this._listeners[path]

        if (listener) {
            listener(change, ...args)
        }
    }
}
