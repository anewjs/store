import { createSelector } from 'reselect'
import { cleanState, isObject, isFunction, isState, isClass } from './utils'
import {
    Store as StoreInterface,
    Subscriptions,
    Listen,
    StateHasChanged,
    IsStaging,
    State,
    MutationType,
    Prop,
    Plugins,
    PluginOptions,
    Modules,
    Redcuers,
    Actions,
    Getters,
    Selectors,
    Listeners,
    Enhance,
    Apis,
    StoreOptions,
    Storage,
    Get,
    SelectorStore,
    PushReducer,
    FunctionOf,
    ActionStore,
    EnhancedAction,
    Dispatch,
    Commit,
    ApiStore,
    Api,
    ListenerContext,
    Select,
    Subscription,
} from './types'

export default class Store implements StoreInterface {
    private subscriptions: Subscriptions = []
    private nextSubscriptions: Subscriptions = []
    private listen: Listen = {}
    private stateHasChanged: StateHasChanged = false
    private isStaging: IsStaging = false

    private push: PushReducer = (state, change) => {
        return typeof change === 'function' ? change(state) : change
    }

    private stage: FunctionOf = () => {
        this.isStaging = true
    }

    private stagePush = (
        path: string,
        args: any[],
        mutationType: MutationType = MutationType.REDUCER
    ) => {
        if (this.isStaging) {
            this.isStaging = false
            this.notifiySubscriptions(path, args, mutationType)
        }
    }

    private ensureCanMutateNextListeners = () => {
        if (this.nextSubscriptions === this.subscriptions) {
            this.nextSubscriptions = this.subscriptions.slice()
        }
    }

    private notifiySubscriptions = (
        path: string,
        args: any[],
        mutationType: MutationType = MutationType.REDUCER
    ) => {
        if (!this.isStaging && this.stateHasChanged) {
            this.stateHasChanged = false
            const listeners = (this.subscriptions = this.nextSubscriptions)

            listeners.forEach(listener => listener(path, args, mutationType))
        }
    }

    private notifiyListeners = (path: string, state: State, ...args: any[]) => {
        const listener: Function = this.listen[path]

        if (listener) {
            listener(state, ...args)
        }
    }

    private prop: Prop = (propName: string, defaultValue: any) => {
        return (_, { [propName]: propValue = defaultValue } = {}) => propValue
    }

    private installPlugins(options: Exclude<StoreOptions, Plugins>, plugins?: Plugins) {
        if (plugins !== undefined) {
            const pluginOptions: PluginOptions = {
                get: () => options,
                inject: updates => {
                    Object.keys(updates).forEach(updateType => {
                        Object.assign(options[updateType] || {}, updates[updateType])
                    })
                },
            }

            plugins.forEach(plugin => plugin(this, pluginOptions))
        }
    }

    private installModules(modules: Modules = {}, storage: Storage) {
        Object.entries(modules).forEach(([moduleName, moduleOptions]) => {
            if (moduleOptions.state === undefined) moduleOptions.state = {}
            if (!moduleOptions.getters) moduleOptions.getters = {}
            if (!moduleOptions.reducers) moduleOptions.reducers = {}

            Object.keys(moduleOptions).forEach(type => {
                switch (type) {
                    case 'modules':
                        this.installModules(moduleOptions.modules, moduleOptions)
                        break
                    case 'state':
                        moduleOptions.state = cleanState(moduleOptions.state)
                    default:
                        if (!storage[type]) storage[type] = {}

                        if (storage[type][moduleName]) {
                            storage[type][moduleName] = Object.assign(
                                {},
                                moduleOptions[type],
                                storage[type][moduleName]
                            )
                        } else {
                            storage[type][moduleName] = moduleOptions[type]
                        }

                        break
                }
            })

            // push reducer
            storage.reducers[moduleName] = Object.assign({}, storage.reducers[moduleName], {
                push: this.push,
            })
        })
    }

    private installGetters(getters: Getters, getState: Get) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    getState[getName] = (...args: any[]) => get(getState(), ...args)
                    break
                case 'object':
                    getState[getName] = () => {
                        const state = getState()

                        if (isObject(state)) {
                            return state[getName]
                        }

                        return state
                    }

                    this.installGetters(get, getState[getName] as Get)
                    break
            }
        })
    }

    private installSelectors(
        selectors: Selectors,
        storage: Storage<object | Function>,
        store: SelectorStore
    ) {
        Object.entries(selectors).forEach(([selectorName, selector]) => {
            switch (typeof selector) {
                case 'function':
                    const memoizedSelector = (createSelector as any)(...selector(store))

                    storage[selectorName] = (props: Object = {}, args: Object = {}) => {
                        const state = store.get()

                        return memoizedSelector(state, state === props ? args : props)
                    }
                    break
                case 'object':
                    storage[selectorName] = {}

                    this.installSelectors(selector, storage[selectorName] as typeof storage, {
                        get: store.get[selectorName] as Get,
                        select: store.select[selectorName] as Selectors,
                        prop: this.prop,
                        core: store,
                    })
                    break
            }
        })
    }

    private installReducers(
        reducers: Redcuers,
        storage: Storage<FunctionOf>,
        stateRef: State,
        getState: Get,
        prefix: string = '',
        propagate: Function = !isObject(stateRef)
            ? (change: State) => (this.state = change)
            : (change: State, containerName: string) => {
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
                        this.stateHasChanged =
                            this.stateHasChanged || (change !== undefined && change !== state)

                        if (this.stateHasChanged) {
                            propagate(change)
                        }

                        this.notifiyListeners(path, getState(), ...args)
                        this.notifiySubscriptions(path, args)

                        return change
                    }
                    break
                case 'object':
                    storage[reducerName] = (target: string, ...args: any[]) => {
                        return this.commit(path + (target ? `/${target}` : ''), ...args)
                    }

                    storage[reducerName].stage = this.stage

                    const targetGetState = getState[reducerName] as Get
                    const targetState = isObject(stateRef) && stateRef[reducerName]
                    const isTargetStateObject = isObject(targetState)
                    const objectInstance = isTargetStateObject ? {} : []
                    const nextPropogation = isTargetStateObject
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

                    this.installReducers(
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

    private installActions(
        actions: Actions,
        storage: Dispatch,
        store: ActionStore,
        prefix: string = ''
    ) {
        const enhanceActions = this.enhance.actions

        Object.entries(actions).forEach(([actionName, action]) => {
            const path = prefix + actionName

            switch (typeof action) {
                case 'function':
                    if (enhanceActions) {
                        storage[actionName] = (...args: any[]) => {
                            this.stage()
                            const result = (action as EnhancedAction)(store, ...args)

                            if (isState(result) || isFunction(result)) {
                                store.commit.push(result)
                            }

                            this.stagePush(path, args, MutationType.ACTION)
                            return result
                        }
                    } else {
                        storage[actionName] = (...args: any[]) => {
                            this.stage()
                            const result = action(store, ...args)
                            this.stagePush(path, args, MutationType.ACTION)
                            return result
                        }
                    }
                    break
                case 'object':
                    const dispatch = ((target: string, ...args: any[]) => {
                        return this.dispatch(path + (target ? `/${target}` : ''), ...args)
                    }) as Dispatch

                    storage[actionName] = dispatch

                    this.installActions(
                        action,
                        storage[actionName] as typeof storage,
                        {
                            dispatch,
                            select: store.select[actionName] as Selectors,
                            get: store.get[actionName] as Get,
                            commit: store.commit[actionName] as Commit,
                            api: store.api[actionName] as Apis,
                            core: store,
                        },
                        path + '/'
                    )
                    break
            }
        })
    }

    private installApi(apis: Apis, storage: Apis, store: ApiStore, prefix: string = '') {
        Object.entries(apis).forEach(([apiName, api]) => {
            const path = prefix + apiName

            if (isClass(api) || apiName === 'context') {
                try {
                    storage[apiName] = api
                } catch (e) {}
                return
            }
            if (['beforeRequest', 'afterRequest'].includes(apiName as string)) {
                storage[apiName] = (...args: any[]) => (api as Function)(store, ...args)
                return
            }
            if (isFunction<Api>(api)) {
                storage[apiName] = (...args: any[]) => {
                    if (isFunction(store.api.beforeRequest)) {
                        ;(store.api.beforeRequest as Function)(path, args)
                    }

                    const result = (api as Function)(store, ...args)

                    if (isFunction(store.api.afterRequest)) {
                        result.then((result: any) =>
                            (store.api.afterRequest as Function)(path, result)
                        )
                    }

                    return result
                }
                return
            }
            if (isObject<Api>(api)) {
                storage[apiName] = {} as Apis
                this.installApi(
                    api,
                    storage[apiName] as Apis,
                    {
                        select: store.select[apiName] as Selectors,
                        get: store.get[apiName] as Get,
                        api: store.api[apiName] as Apis,
                        core: store,
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

    private installListeners(
        listeners: Listeners,
        storage: Listen,
        state: State,
        store: ListenerContext,
        prefix: string = ''
    ) {
        const listenerKeys = Object.keys(listeners)

        for (let i = 0, listenersLen = listenerKeys.length; i < listenersLen; i++) {
            const contextName = listenerKeys[i]
            const context = listeners[contextName]

            const contextKeys = Object.keys(context)
            const contextStore: ListenerContext = {
                state: {},
                store: {
                    select: (store.store.select[contextName] || {}) as Selectors,
                    get: (store.store.get[contextName] || {}) as Get,
                    commit: (store.store.commit[contextName] || {}) as Commit,
                    api: (store.store.api[contextName] || {}) as Apis,
                    dispatch: (store.store.dispatch[contextName] || {}) as Dispatch,
                    core: store.store,
                },
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
                            const path = `${prefix}${targetName}/${String(listenerName)}`
                            const listenerPath = `${contextName}(${path})`
                            const prevListener = storage[path]
                            const prevListenerBinded = prevListener && prevListener.bind({})

                            if (prevListenerBinded) {
                                storage[path] = (targetState: State, ...args: any[]) => {
                                    prevListenerBinded(targetState, ...args)
                                    this.stage()
                                    const result = (listener as Function)(
                                        { ...contextStore, state: targetState },
                                        ...args
                                    )

                                    if (isState(result) || isFunction(result)) {
                                        contextStore.store.commit.push(result)
                                    }

                                    this.stagePush(listenerPath, args)
                                }
                            } else {
                                storage[path] = (targetState: State, ...args: any[]) => {
                                    this.stage()
                                    const result = (listener as Function)(
                                        { ...contextStore, state: targetState },
                                        ...args
                                    )

                                    if (isState(result) || isFunction(result)) {
                                        contextStore.store.commit.push(result)
                                    }

                                    this.stagePush(listenerPath, args)
                                }
                            }

                            break
                        case 'object':
                            this.installListeners(
                                context as Listeners,
                                storage,
                                isObject(state) ? state[contextName] : state,
                                contextStore,
                                contextName + '/'
                            )
                            break
                    }
                }
            }
        }
    }

    private extendCommit() {
        this.stage.push = this.stagePush
        this.commit.stage = this.stage
    }

    private state: State = {}
    private reducers: Redcuers = {}
    private actions: Actions = {}
    private getters: Getters = {}
    private selectors: Selectors = {}
    private listeners: Listeners = {}
    private enhance: Enhance = {}
    private api: Apis = {}
    private modules: Modules = {}

    public constructor(options: StoreOptions) {
        if (options) {
            this.use(options)
        }
    }

    public use({ plugins, ...options }: StoreOptions) {
        // Modify Options
        this.installPlugins(options, plugins)

        const {
            state = this.state,
            reducers = this.reducers,
            actions = this.actions,
            getters = this.getters,
            selectors = this.selectors,
            listeners = this.listeners,
            enhance = this.enhance,
            api = this.api,
            modules = this.modules,
        } = options

        // Assigned Options
        this.actions = actions
        this.getters = getters
        this.selectors = selectors
        this.listeners = listeners
        this.enhance = enhance
        this.modules = modules

        // Extended Options
        this.state = cleanState(state)
        this.reducers = Object.assign(reducers, { push: this.push })
        this.api = Object.assign({}, api)

        // Load Modules
        this.installModules(modules, this)

        // Install Basic Store Features
        this.installGetters(getters, this.get)
        this.installReducers(reducers, this.commit, this.state, this.get)

        // Install Advanced Store Features
        this.installApi(this.api, this.api, {
            get: this.get,
            select: this.select,
            api: this.api,
        })
        this.installSelectors(selectors, this.select, {
            get: this.get,
            select: this.select,
            prop: this.prop,
        })
        this.installActions(actions, this.dispatch, {
            get: this.get,
            select: this.select,
            commit: this.commit,
            dispatch: this.dispatch,
            api: this.api,
        })
        this.installListeners(this.listeners, this.listen, this.state, {
            state: this.state,
            store: {
                get: this.get,
                select: this.select,
                commit: this.commit,
                dispatch: this.dispatch,
                api: this.api,
            },
        })

        // Extend Commit Functionality
        this.extendCommit()
    }

    /**
    | ------------------
    | Store Methods
    | ------------------
    | Exposed API
    |
    */

    public subscribe = (listener: Subscription) => {
        if (typeof listener !== 'function') {
            throw new Error('Expected the listener to be a function.')
        }

        let isSubscribed = true

        this.ensureCanMutateNextListeners()
        this.nextSubscriptions.push(listener)

        const unsubscribe = () => {
            if (!isSubscribed) {
                return
            }

            isSubscribed = false

            this.ensureCanMutateNextListeners()
            const index = this.nextSubscriptions.indexOf(listener)
            this.nextSubscriptions.splice(index, 1)
        }

        return unsubscribe
    }

    public get: Get = () => {
        return this.state
    }

    public select: Select = () => {}

    public dispatch: Dispatch = (actionPath: string, ...args: any[]) => {
        const actionPaths = actionPath.split('/')
        const lastActionIndex = actionPaths.length - 1

        return actionPaths.reduce((actionParent, path, i) => {
            if (i === lastActionIndex) {
                const action: Function = actionParent[path]

                return typeof action === 'function' && action(...args)
            }

            return actionParent[path]
        }, this.dispatch)
    }

    public commit: Commit = ((reducerPath: string, ...args: any[]) => {
        const reducerPaths = reducerPath.split('/')
        const lastReducerIndex = reducerPaths.length - 1

        return reducerPaths.reduce((reducerParent, path, i) => {
            if (i === lastReducerIndex) {
                const reducer: Function = reducerParent[path]

                return typeof reducer === 'function' && reducer(...args)
            }

            return reducerParent[path]
        }, this.commit)
    }) as Commit
}
