import { createSelector } from 'reselect'

import CALL_TYPES from './callTypes'
import isPlainObject from './isPlainObject'
import isPureFunction from './isPureFunction'
import isClass from './isClass'

export default class Store {
    constructor(options) {
        if (options) {
            this.use(options)
        }
    }

    use({ plugins = [], ...options } = {}) {
        // Initialize Listeners
        this._subscriptions = []
        this._nextSubscriptions = this._subscriptions
        this._listeners = {}
        this._stateHasChanged = false

        // Modify Options
        this._installPlugins(plugins, options)

        const {
            state = this.state || {},
            reducers = this.reducers || {},
            actions = this.actions || {},
            getters = this.getters || {},
            selectors = this.selectors || {},
            listeners = this.listeners || {},
            enhance = this.enhance || {},
            api = this.api || {},
            modules = this.modules,
        } = options

        // Assign Options
        if (typeof state === 'object') {
            const { __esModule, ...cleanState } = state

            this.state = cleanState
        } else {
            this.state = state
        }

        this.reducers = Object.assign(reducers, { push: this._push })
        this.actions = actions
        this.getters = getters
        this.selectors = selectors
        this.listeners = listeners
        this.enhance = enhance
        this.modules = modules
        this.api = { ...api }

        // Initialize Store
        this._initStore()

        // Install Options (From, To, ..args)
        this._installModules(modules, this)
        this._installApi(this.api, this.api, this)
        this._installGetters(getters, this.get)
        this._installSelectors(selectors, this.select, {
            get: this.get,
            select: this.select,
            prop: this._prop,
        })
        this._installReducers(reducers, this.commit, this.state, this.get)
        this._installActions(actions, this.dispatch, this)
        this._installListeners(this.listeners, this._listeners, this.state, this)

        // Extend Commit Functionality
        this._extendCommit()
    }

    _installPlugins(plugins, options) {
        if (plugins.length) {
            const param = {
                get: () => options,
                inject: updates => {
                    Object.entries(updates).forEach(([updateType, update]) => {
                        options[updateType] = Object.assign(options[updateType] || {}, update)
                    })
                },
            }

            plugins.forEach(plugin => plugin(this, param))
        }
    }

    _initStore() {
        this.select = {}
    }

    _installModules(modules = {}, storage) {
        Object.entries(modules).forEach(([moduleName, module]) => {
            if (module.state === undefined) module.state = {}
            if (!module.getters) module.getters = {}
            if (!module.reducers) module.reducers = {}

            Object.keys(module).forEach(type => {
                switch (type) {
                    case 'modules':
                        this._installModules(module.modules, module)
                        break
                    case 'state':
                        if (typeof module.state === 'object') {
                            const { __esModule, ...cleanState } = module.state

                            module.state = cleanState
                        }
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

            // push reducer
            storage.reducers[moduleName] = Object.assign({}, storage.reducers[moduleName], {
                push: this._push,
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
                    const memoizedSelector = createSelector(...selector(store))

                    storage[selectorName] = (props = {}, args = {}) => {
                        const state = store.get()

                        return memoizedSelector(state, state === props ? args : props)
                    }
                    break
                case 'object':
                    storage[selectorName] = {}

                    this._installSelectors(selector, storage[selectorName], {
                        get: store.get[selectorName],
                        select: store.select[selectorName],
                        prop: this._prop,
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
                        this._stateHasChanged =
                            this._stateHasChanged || (change !== undefined && change !== state)

                        if (this._stateHasChanged) {
                            propagate(change)
                        }

                        this._notifiyListeners(path, getState(), ...args)
                        this._notifiySubscriptions(path, args)

                        return change
                    }
                    break
                case 'object':
                    storage[reducerName] = (target, ...args) =>
                        this.commit(path + (target ? `/${target}` : ''), ...args)
                    storage[reducerName].stage = this._stage

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
        const enhanceActions = this.enhance.actions

        Object.entries(actions).forEach(([actionName, action]) => {
            const path = prefix + actionName

            switch (typeof action) {
                case 'function':
                    if (enhanceActions) {
                        storage[actionName] = (...args) => {
                            this._stage()
                            const result = action(store, ...args)

                            if (result !== undefined) {
                                store.commit.push(result)
                            }

                            this._stagePush(path, args, CALL_TYPES.ACTION)
                            return result
                        }
                    } else {
                        storage[actionName] = (...args) => {
                            this._stage()
                            const result = action(store, ...args)
                            this._stagePush(path, args, CALL_TYPES.ACTION)
                            return result
                        }
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
                            api: store.api[actionName],
                            core: this,
                        },
                        path + '/'
                    )
                    break
            }
        })
    }

    _installApi(apis, storage, store, prefix = '') {
        Object.entries(apis).forEach(([apiName, api]) => {
            const path = prefix + apiName

            if (isClass(api) || apiName === 'context') {
                try {
                    storage[apiName] = api
                } catch (e) {}
                return
            }
            if (isPureFunction(api)) {
                storage[apiName] = (...args) => {
                    if (storage[apiName].beforeRequest) storage[apiName].beforeRequest(store, path)
                    const result = api(store, ...args)
                    if (storage[apiName].afterRequest) storage[apiName].afterRequest(store, path)
                    return result
                }
                return
            }
            if (isPlainObject(api)) {
                storage[apiName] = {}
                this._installApi(
                    api,
                    storage[apiName],
                    {
                        select: store.select[apiName] || {},
                        get: store.get[apiName] || {},
                        dispatch: store.dispatch[apiName] || {},
                        commit: store.commit[apiName] || {},
                        api: store.api[apiName] || {},
                        core: this,
                    },
                    path + '/'
                )
            } else {
                try {
                    storage[apiName] = api
                } catch (e) {}
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
                api: store.api[contextName] || {},
                core: this,
            }

            for (let j = 0, contextLen = contextKeys.length; j < contextLen; j++) {
                const targetName = contextKeys[j]
                const target = context[targetName]

                if (typeof target !== 'object') continue

                const targetKeys = Object.keys(target)

                for (let k = 0, targetLen = targetKeys.length; k < targetLen; k++) {
                    const listenerName = targetKeys[k]
                    const listener = target[listenerName]

                    switch (typeof listener) {
                        case 'function':
                            const path = `${prefix}${targetName}/${listenerName}`
                            const listenerPath = `${contextName}(${path})`
                            const prevListener = storage[path]
                            const prevListenerBinded = prevListener && prevListener.bind({})

                            if (prevListenerBinded) {
                                storage[path] = (targetState, ...args) => {
                                    prevListenerBinded(targetState, ...args)
                                    this._stage()
                                    const result = listener(
                                        { store: contextStore, state: targetState },
                                        ...args
                                    )

                                    if (result !== undefined) {
                                        contextStore.commit.push(result)
                                    }

                                    this._stagePush(listenerPath, args)
                                }
                            } else {
                                storage[path] = (targetState, ...args) => {
                                    this._stage()
                                    const result = listener(
                                        { store: contextStore, state: targetState },
                                        ...args
                                    )

                                    if (result !== undefined) {
                                        contextStore.commit.push(result)
                                    }

                                    this._stagePush(listenerPath, args)
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

    _extendCommit() {
        this._stage.push = this._stagePush
        this.commit.stage = this._stage
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

    /**
     | ------------------
     | Internal API
     | ------------------
     |
     */

    _push = (state, change) => {
        return typeof change === 'function' ? change(state) : change
    }

    _stage = () => {
        this.isStaging = true
    }

    _stagePush = (path, args, callType = CALL_TYPES.REDUCER) => {
        if (this.isStaging) {
            this.isStaging = false
            this._notifiySubscriptions(path, args, callType)
        }
    }

    _ensureCanMutateNextListeners = () => {
        if (this._nextSubscriptions === this._subscriptions) {
            this._nextSubscriptions = this._subscriptions.slice()
        }
    }

    _notifiySubscriptions = (path, args, callType) => {
        if (!this.isStaging && this._stateHasChanged) {
            this._stateHasChanged = false
            const listeners = (this._subscriptions = this._nextSubscriptions)

            listeners.forEach(listener => listener(path, args, callType))
        }
    }

    _notifiyListeners = (path, state, ...args) => {
        const listener = this._listeners[path]

        if (listener) {
            listener(state, ...args)
        }
    }

    _prop = (propName, defaultValue) => {
        return (s, { [propName]: propValue = defaultValue } = {}) => propValue
    }
}
