import { createSelector } from 'reselect'

import { CallType, ObjectWithProps, FunctionWithProps } from './types'
import isPlainObject from './isPlainObject'
import isPureFunction from './isPureFunction'
import isClass from './isClass'

interface Options extends ObjectWithProps {
    state?: State
    plugins?: Array<Function>
    reducers?: ObjectWithProps
    actions?: ObjectWithProps
    getters?: ObjectWithProps
    selectors?: ObjectWithProps
    listeners?: ObjectWithProps
    enhance?: ObjectWithProps
    api?: ObjectWithProps
    modules?: ObjectWithProps
}

type StoreArg = {
    select: FunctionWithProps
    get: FunctionWithProps
    dispatch: FunctionWithProps
    commit: FunctionWithProps
    api: ObjectWithProps
    core?: Store
}

type SelectorStoreArg = {
    select: FunctionWithProps
    get: FunctionWithProps
    prop: Function
    core?: Store
}

type State = ObjectWithProps | number | string | any

type Selector = (store: SelectorStoreArg) => Array<Function>

const defaultOptions: Options = {
    plugins: [],
    state: {},
    reducers: {},
    actions: {},
    getters: {},
    selectors: {},
    listeners: {},
    enhance: {},
    api: {},
    modules: {},
}

export default class Store {
    _subscriptions: Array<Function> = []
    _nextSubscriptions: Array<Function> = []
    _listeners: ObjectWithProps = {}
    _stateHasChanged: boolean = false

    state: ObjectWithProps = {}
    reducers: ObjectWithProps = {}
    actions: ObjectWithProps = {}
    getters: ObjectWithProps = {}
    selectors: ObjectWithProps = {}
    listeners: ObjectWithProps = {}
    enhance: ObjectWithProps = {}
    api: ObjectWithProps = {}
    modules: ObjectWithProps = {}

    select: FunctionWithProps = () => {}
    isStaging: boolean = false

    constructor(options: Options) {
        if (options) {
            this.use(options)
        }
    }

    use({ plugins = [], ...options }: Options = defaultOptions) {
        // Initialize Listeners
        this._subscriptions = []
        this._nextSubscriptions = this._subscriptions
        this._listeners = {}
        this._stateHasChanged = false

        // Modify Options
        this._installPlugins(plugins, options)

        const {
            state = this.state || defaultOptions.state,
            reducers = this.reducers || defaultOptions.reducers,
            actions = this.actions || defaultOptions.actions,
            getters = this.getters || defaultOptions.getters,
            selectors = this.selectors || defaultOptions.selectors,
            listeners = this.listeners || defaultOptions.listeners,
            enhance = this.enhance || defaultOptions.enhance,
            api = this.api || defaultOptions.api,
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

    _installPlugins(plugins: Array<Function>, options: Options) {
        if (plugins.length) {
            const param = {
                get: () => options,
                inject: (updates: Object) => {
                    Object.entries(updates).forEach(([updateType, update]: [string, Object]) => {
                        options[updateType] = Object.assign(options[updateType] || {}, update)
                    })
                },
            }

            plugins.forEach(plugin => plugin(this, param))
        }
    }

    _installModules(modules: Object = {}, storage: ObjectWithProps) {
        Object.entries(modules).forEach(([moduleName, module]: [string, Options]) => {
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

    _installGetters(getters: Object, getState: FunctionWithProps) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    getState[getName] = (...args: any[]) => get(getState(), ...args)
                    break
                case 'object':
                    getState[getName] = () => getState()[getName]
                    this._installGetters(get, getState[getName])
                    break
            }
        })
    }

    _installSelectors(selectors: Object, storage: ObjectWithProps, store: SelectorStoreArg) {
        Object.entries(selectors).forEach(([selectorName, selector]: [string, Selector]) => {
            switch (typeof selector) {
                case 'function':
                    const memoizedSelector = (createSelector as any)(...selector(store))

                    storage[selectorName] = (props: Object = {}, args: Object = {}) => {
                        const state: Object = store.get()

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
        reducers: Object,
        storage: ObjectWithProps,
        stateRef: ObjectWithProps,
        getState: FunctionWithProps,
        prefix: string = '',
        propagate: Function = typeof stateRef !== 'object'
            ? (change: Object) => (this.state = change)
            : (change: Object, containerName: string) => {
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
                    storage[reducerName] = (...args: any[]) => {
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
                    storage[reducerName] = (target: string, ...args: any[]) =>
                        this.commit(path + (target ? `/${target}` : ''), ...args)
                    storage[reducerName].stage = this._stage

                    const targetGetState = getState[reducerName]
                    const targetState = typeof stateRef === 'object' && stateRef[reducerName]
                    const objectInstance = isPlainObject(targetState) ? {} : []
                    const nextPropogation =
                        targetState && typeof targetState !== 'object'
                            ? (change: any) => propagate({ [reducerName]: change })
                            : (change: any, containerName: string) => {
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

    _installActions(
        actions: Object,
        storage: ObjectWithProps,
        store: StoreArg,
        prefix: string = ''
    ) {
        const enhanceActions = this.enhance.actions

        Object.entries(actions).forEach(([actionName, action]) => {
            const path = prefix + actionName

            switch (typeof action) {
                case 'function':
                    if (enhanceActions) {
                        storage[actionName] = (...args: any[]) => {
                            this._stage()
                            const result = action(store, ...args)

                            if (result !== undefined) {
                                store.commit.push(result)
                            }

                            this._stagePush(path, args, CallType.ACTION)
                            return result
                        }
                    } else {
                        storage[actionName] = (...args: any[]) => {
                            this._stage()
                            const result = action(store, ...args)
                            this._stagePush(path, args, CallType.ACTION)
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

    _installApi(apis: Object, storage: ObjectWithProps, store: StoreArg, prefix: string = '') {
        Object.entries(apis).forEach(([apiName, api]) => {
            const path = prefix + apiName

            if (isClass(api) || apiName === 'context') {
                try {
                    storage[apiName] = api
                } catch (e) {}
                return
            }
            if (['beforeRequest', 'afterRequest'].includes(apiName)) {
                storage[apiName] = (...args: any[]) => api(store, ...args)
                return
            }
            if (isPureFunction(api)) {
                storage[apiName] = async (...args: any[]) => {
                    if (typeof store.api.beforeRequest === 'function')
                        store.api.beforeRequest(path, args)
                    const result = await api(store, ...args)
                    if (typeof store.api.afterRequest === 'function')
                        store.api.afterRequest(path, result)
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

    _installListeners(
        listeners: ObjectWithProps,
        storage: ObjectWithProps,
        state: State,
        store: StoreArg,
        prefix: string = ''
    ) {
        const listenerKeys = Object.keys(listeners)

        for (let i = 0, listenersLen = listenerKeys.length; i < listenersLen; i++) {
            const contextName = listenerKeys[i]
            const context: ObjectWithProps = listeners[contextName]

            const contextKeys = Object.keys(context)
            const contextStore: StoreArg = {
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
                    const reducerName = targetKeys[k]
                    const reducer = target[reducerName]

                    switch (typeof reducer) {
                        case 'function':
                            const path = `${prefix}${targetName}/${reducerName}`
                            const listenerPath = `${contextName}(${path})`
                            const prevListener = storage[path]
                            const prevListenerBinded = prevListener && prevListener.bind({})

                            if (prevListenerBinded) {
                                storage[path] = (targetState: Object, ...args: any[]) => {
                                    prevListenerBinded(targetState, ...args)
                                    this._stage()
                                    const result = reducer(contextStore, targetState, ...args)

                                    if (result !== undefined) {
                                        contextStore.commit.push(result)
                                    }

                                    this._stagePush(listenerPath, args)
                                }
                            } else {
                                storage[path] = (targetState: Object, ...args: any[]) => {
                                    this._stage()
                                    const result = reducer(contextStore, targetState, ...args)

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

    subscribe = (listener: Function) => {
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

    get: FunctionWithProps = () => {
        return this.state
    }

    dispatch: FunctionWithProps = (actionPath: string, ...args: any[]) => {
        const actionPaths = actionPath.split('/')
        const lastActionIndex = actionPaths.length - 1

        return actionPaths.reduce((actionParent: FunctionWithProps, path: string, i: number) => {
            if (i === lastActionIndex) {
                const action: Function = actionParent[path]

                return typeof action === 'function' && action(...args)
            }

            return actionParent[path]
        }, this.dispatch)
    }

    commit: FunctionWithProps = (reducerPath: string, ...args: any[]) => {
        const reducerPaths = reducerPath.split('/')
        const lastReducerIndex = reducerPaths.length - 1

        return reducerPaths.reduce((reducerParent: FunctionWithProps, path: string, i: number) => {
            if (i === lastReducerIndex) {
                const reducer: Function = reducerParent[path]

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

    private _push = (state: Object, change: Function | Object) => {
        return typeof change === 'function' ? change(state) : change
    }

    private _stage: FunctionWithProps = () => {
        this.isStaging = true
    }

    private _stagePush = (path: string, args: any[], callType: CallType = CallType.REDUCER) => {
        if (this.isStaging) {
            this.isStaging = false
            this._notifiySubscriptions(path, args, callType)
        }
    }

    private _ensureCanMutateNextListeners = () => {
        if (this._nextSubscriptions === this._subscriptions) {
            this._nextSubscriptions = this._subscriptions.slice()
        }
    }

    private _notifiySubscriptions = (
        path: string,
        args: any[],
        callType: CallType = CallType.REDUCER
    ) => {
        if (!this.isStaging && this._stateHasChanged) {
            this._stateHasChanged = false
            const listeners = (this._subscriptions = this._nextSubscriptions)

            listeners.forEach(listener => listener(path, args, callType))
        }
    }

    private _notifiyListeners = (path: string, state: object, ...args: any[]) => {
        const listener: Function = this._listeners[path]

        if (listener) {
            listener(state, ...args)
        }
    }

    private _prop = (propName: string, defaultValue: any) => {
        return (_: any, { [propName]: propValue = defaultValue }: ObjectWithProps = {}) => propValue
    }
}
