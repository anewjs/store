/**
 * -----------------------
 * Helper Types
 * -----------------------
 */

export type Args<T extends (first: any, ...args: any) => any> = T extends (
  first: any,
  ...args: infer P
) => any
  ? P
  : never

/**
 * -----------------------
 * Alias Types
 * -----------------------
 */

type AnyStore = Store<any, any, any, any>

type AnyStoreCollection = StoreCollection<any>

/**
 * -----------------------
 * Data Types
 * -----------------------
 */

export enum MethodType {
  REDUCER = 'reducer',
  ACTION = 'action',
}

/**
 * -----------------------
 * Base Types
 * -----------------------
 */

export interface BaseState {
  [stateKey: string]: any
}

export interface BaseReducers<State> {
  [reducerName: string]: (state: State, ...args: any) => Readonly<Partial<State>> | void
}

export interface BaseGetters<State> {
  [getterName: string]: (state: State, ...args: any) => any
}

export interface BaseActions {
  [actioName: string]: (...args: any) => any
}

export interface BaseStores {
  [storeName: string]: AnyStore | StoreCollection<BaseStores>
}

export interface BaseUnsubscribe {
  (): void
}

export interface BaseSubscriptionArg<
  State extends BaseState,
  Reducers extends BaseReducers<State>,
  Actions extends BaseActions
> {
  methodType: MethodType
  methodName: keyof (Reducers & Actions)
  methodArgs: Array<any>
  stateChange: Readonly<Partial<State>>
}

export interface BaseSubscription<
  State extends BaseState,
  Reducers extends BaseReducers<State>,
  Actions extends BaseActions
> {
  (arg: BaseSubscriptionArg<State, Reducers, Actions>): any
}

export interface BaseCollectionSubscriptionArg<
  Stores extends BaseStores,
  State extends BaseStoreMergeProp<Stores, 'state'>,
  Reducers extends BaseStoreMergeProp<Stores, 'reducers'>,
  Actions extends BaseStoreMergeProp<Stores, 'actions'>
> {
  storeName: keyof Stores
  methodType: MethodType
  methodName: keyof (Reducers & Actions)
  methodArgs: Array<any>
  stateChange: Readonly<Partial<State>>
}

export interface BaseCollectionSubscription<
  Stores extends BaseStores,
  State extends BaseStoreMergeProp<Stores, 'state'>,
  Reducers extends BaseStoreMergeProp<Stores, 'reducers'>,
  Actions extends BaseStoreMergeProp<Stores, 'actions'>
> {
  (arg: BaseCollectionSubscriptionArg<Stores, State, Reducers, Actions>): any
}

/**
 * -----------------------
 * Wrapper Types
 * -----------------------
 */

export type BaseReducerWrappers<State extends BaseState, Reducers extends BaseReducers<State>> = {
  [RKey in keyof Reducers]: (...args: Args<Reducers[RKey]>) => ReturnType<Reducers[RKey]>
}

export type BaseGetterWrappers<State extends BaseState, Getters extends BaseGetters<State>> = {
  [GKey in keyof Getters]: (...args: Args<Getters[GKey]>) => ReturnType<Getters[GKey]>
}

export type BaseStoreMergeProp<Stores extends BaseStores, K extends keyof AnyStore> = {
  [STKey in keyof Stores]: Stores[STKey][K]
}

/**
 * -----------------------
 * Class Types
 * -----------------------
 */

export default class Store<
  State extends BaseState,
  Reducers extends BaseReducers<State>,
  Getters extends BaseGetters<State>,
  Actions extends BaseActions
> {
  private _isGroup: boolean = false
  private _isStateChange: boolean = false

  private _collection?: AnyStoreCollection
  private _collectionKey?: string

  private _state: State
  private _initialState: State
  private _groupedStateChange = {} as Partial<State>

  private _reducers?: Reducers
  private _actions?: Actions
  private _getters?: Getters

  private _subscriptions: null | BaseSubscription<State, Reducers, Actions>[]
  private _nextSubscriptions: BaseSubscription<State, Reducers, Actions>[]

  public actions = {} as Actions
  public reducers = {} as BaseReducerWrappers<State, Reducers>
  public getters = {} as BaseGetterWrappers<State, Getters>

  constructor(config: { state: State; reducers?: Reducers; getters?: Getters; actions?: Actions }) {
    this._state = config.state
    this._initialState = config.state

    this._reducers = config.reducers
    this._getters = config.getters
    this._actions = config.actions

    this._subscriptions = []
    this._nextSubscriptions = this._subscriptions

    this.initReducers()
    this.initGetters()
    this.initActions()
  }

  // @ts-ignore
  private setCollection<Collection extends AnyStoreCollection>(
    colleciton: Collection,
    collectionKey: string
  ) {
    this._collection = colleciton
    this._collectionKey = collectionKey
  }

  private initReducers() {
    if (this._reducers) {
      const cReducer = createReducerCreator(this)
      Object.entries(this._reducers).forEach(([reducerKey, reducer]) => {
        this.reducers[reducerKey as keyof Reducers] = cReducer(reducer, reducerKey) as any
      })
    }
  }

  private initActions() {
    if (this._actions) {
      const cAction = createActionCreator(this)
      Object.entries(this._actions).forEach(([actionKey, action]) => {
        this.actions[actionKey as keyof Actions] = cAction(action, actionKey) as any
      })
    }
  }

  private initGetters() {
    if (this._getters) {
      const cGetter = createGetterCreator(this)
      Object.entries(this._getters).forEach(([getterKey, getter]) => {
        this.getters[getterKey as keyof Getters] = cGetter(getter)
      })
    }
  }

  private notifyCollection(nextState: State) {
    if (this._collection && this._collectionKey) {
      ;(this._collection as any).onChildrenStateUpdate(this._collectionKey, nextState)
    }
  }

  private notifiySubscriptions(arg: BaseSubscriptionArg<State, Reducers, Actions>) {
    let isCollectionGroup = false

    try {
      isCollectionGroup = this.collection && (this.collection as any).isGroup
    } catch (error) {}

    if (this._isStateChange && !this._isGroup && !isCollectionGroup) {
      this._isStateChange = false
      const listeners = (this._subscriptions = this._nextSubscriptions)
      listeners.forEach(listener => listener(arg))
    } else if (this._isStateChange) {
      this._groupedStateChange = {
        ...this._groupedStateChange,
        ...arg.stateChange,
      }
    }
  }

  private ensureCanMutateNextListeners = () => {
    if (this._nextSubscriptions === this._subscriptions) {
      this._nextSubscriptions = this._subscriptions.slice()
    }
  }

  public subscribe = (listener: BaseSubscription<State, Reducers, Actions>) => {
    let isSubscribed = true

    this.ensureCanMutateNextListeners()
    this._nextSubscriptions.push(listener)

    return () => {
      if (!isSubscribed) return

      isSubscribed = false

      this.ensureCanMutateNextListeners()
      const index = this._nextSubscriptions.indexOf(listener)
      this._nextSubscriptions.splice(index, 1)
      this._subscriptions = null
    }
  }

  public setState(
    stateChange: Partial<State>,
    methodName: string = 'setState',
    methodArgs: any[] = []
  ) {
    this._isStateChange = true
    this.notifyCollection((this._state = { ...this._state, ...stateChange }))
    this.notifiySubscriptions({
      methodType: MethodType.REDUCER,
      methodName,
      methodArgs,
      stateChange,
    })
  }

  public resetState() {
    this.setState(this._initialState, 'resetState')
  }

  get state(): Readonly<State> {
    return this._state
  }

  get initialState(): Readonly<State> {
    return this._initialState
  }

  get collection(): Readonly<AnyStoreCollection> {
    if (!this._collection) throw new Error('Accessing undefined property `collection`')
    return this._collection
  }

  public group() {
    this._isGroup = true
  }

  public groupEnd(methodName: string = 'groupEnd', methodArgs: any[] = []) {
    this._isGroup = false
    this.notifiySubscriptions({
      methodType: MethodType.ACTION,
      methodName,
      methodArgs,
      stateChange: this._groupedStateChange,
    })
  }
}

export class StoreCollection<Stores extends BaseStores> {
  // @ts-ignore
  private isGroup: boolean = false
  private isGroupEnding: boolean = false

  private _collection?: AnyStoreCollection
  private _collectionKey?: string

  private _state = {} as BaseStoreMergeProp<Stores, 'state'>
  private _initialState = {} as BaseStoreMergeProp<Stores, 'initialState'>

  public actions = {} as BaseStoreMergeProp<Stores, 'actions'>
  public reducers = {} as BaseStoreMergeProp<Stores, 'reducers'>
  public getters = {} as BaseStoreMergeProp<Stores, 'getters'>

  constructor(private stores: Stores) {
    Object.keys(this.stores).forEach((storeName: keyof Stores) => {
      const store = this.getStore(storeName)
      ;(store as any).setCollection(this, storeName)

      this._state[storeName] = store.state
      this._initialState[storeName] = store.initialState

      this.reducers[storeName] = store.reducers
      this.actions[storeName] = store.actions
      this.getters[storeName] = store.getters
    })
  }

  // @ts-ignore
  private setCollection<Collection extends AnyStoreCollection>(
    colleciton: Collection,
    collectionKey: string
  ) {
    this._collection = colleciton
    this._collectionKey = collectionKey
  }

  private onChildrenStateUpdate<S extends BaseState>(storeName: string, nextState: S) {
    this.notifyCollection(
      (this._state = {
        ...this._state,
        [storeName]: nextState,
      })
    )
  }

  private notifyCollection(nextState: BaseStoreMergeProp<Stores, 'state'>) {
    if (this._collection && this._collectionKey) {
      this._collection.onChildrenStateUpdate(this._collectionKey, nextState)
    }
  }

  public subscribe(
    listener: BaseCollectionSubscription<
      Stores,
      BaseStoreMergeProp<Stores, 'state'>,
      BaseStoreMergeProp<Stores, 'reducers'>,
      BaseStoreMergeProp<Stores, 'actions'>
    >
  ) {
    const unsubscribes = Object.keys(this.stores).map((storeName: keyof Stores) => {
      return this.getStore(storeName).subscribe((arg: any) => {
        if (!this.isGroupEnding && !this.isGroup) {
          return listener({ storeName, ...arg })
        }
      })
    })

    return () => unsubscribes.map(unsubscribe => unsubscribe())
  }

  public setState(
    stateChange: Partial<BaseStoreMergeProp<Stores, 'state'>>,
    methodName: string = 'setState',
    methodArgs: any[] = []
  ) {
    this.group()
    Object.entries(stateChange).forEach(([storeName, storeStateChange]) => {
      const store = this.getStore(storeName)
      if (store) store.setState(storeStateChange as any, `${methodName}/${storeName}`, methodArgs)
    })
    this.groupEnd()
  }

  public resetState() {
    Object.keys(this.stores).forEach((storeName: keyof Stores) => {
      this.getStore(storeName).resetState()
    })
  }

  get state(): Readonly<BaseStoreMergeProp<Stores, 'state'>> {
    return this._state
  }

  get initialState(): Readonly<BaseStoreMergeProp<Stores, 'initialState'>> {
    return this._initialState
  }

  get collection(): Readonly<AnyStoreCollection> {
    if (!this._collection) throw new Error('Accessing undefined property `collection`')
    return this._collection
  }

  public getStore<ST extends keyof Stores>(storeName: ST): Stores[ST] {
    return this.stores[storeName]
  }

  public group() {
    this.isGroup = true
  }

  public groupEnd() {
    this.isGroupEnding = true
    this.isGroup = false

    const stores = Object.values(this.stores)

    stores.forEach((store, i) => {
      if (stores.length - 1 === i) {
        this.isGroupEnding = false
      }

      store.groupEnd()
    })
  }
}

/**
 * -----------------------
 * Store Prop Creators
 * -----------------------
 */

export function createStore<State extends BaseState>(state: State) {
  return new Store({ state })
}

export function createActionCreator<S extends AnyStore | AnyStoreCollection>(store: S) {
  function createAction<A extends (...args: any) => any>(
    actionName: string,
    action: A
  ): (...args: Parameters<A>) => ReturnType<A>
  function createAction<A extends (...args: any) => any>(
    action: A,
    actionName?: string
  ): (...args: Parameters<A>) => ReturnType<A>
  function createAction<A extends (...args: any) => any>(
    action: A,
    actionName: string = action.name
  ) {
    let actionResolved: A
    let actionNameResolved: string

    if (typeof action === 'string' && typeof actionName === 'function') {
      actionNameResolved = action as any
      actionResolved = actionName as any
    } else {
      actionNameResolved = actionName
      actionResolved = action
    }

    return (...args: Parameters<A>): ReturnType<A> => {
      store.group()
      const result = actionResolved(...(args as any))
      store.groupEnd(actionNameResolved, args)
      return result
    }
  }

  return createAction
}

export function createReducerCreator<S extends AnyStore | AnyStoreCollection>(store: S) {
  function createReducer<
    R extends (state: S['state'], ...args: any) => Parameters<S['setState']>[0] | void
  >(reducerName: string, reducer: R): (...args: Args<typeof reducer>) => ReturnType<R>
  function createReducer<
    R extends (state: S['state'], ...args: any) => Parameters<S['setState']>[0] | void
  >(reducer: R, reducerName?: string): (...args: Args<typeof reducer>) => ReturnType<R>
  function createReducer<
    R extends (state: S['state'], ...args: any) => Parameters<S['setState']>[0] | void
  >(reducer: R, reducerName: string = reducer.name) {
    let reducerResolved: R
    let reducerNameResolved: string

    if (typeof reducer === 'string' && typeof reducerName === 'function') {
      reducerNameResolved = reducer as any
      reducerResolved = reducerName as any
    } else {
      reducerNameResolved = reducerName
      reducerResolved = reducer
    }

    return (...args: Args<typeof reducer>): ReturnType<R> => {
      const result = reducerResolved(store.state, ...(args as any))
      if (result && result !== store.state) {
        store.setState(result, reducerNameResolved, args)
      }
      return result as any
    }
  }

  return createReducer
}

export function createGetterCreator<S extends AnyStore | AnyStoreCollection>(store: S) {
  return <G extends (state: S['state'], ...args: any) => any>(getter: G) => {
    return (...args: Args<typeof getter>): ReturnType<G> => {
      return getter(store.state, ...(args as any))
    }
  }
}
