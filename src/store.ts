export type Args<T extends (first: any, ...args: any) => any> = T extends (
  first: any,
  ...args: infer P
) => any
  ? P
  : never

/**
 * -----------------------
 * Store
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

export default class Store<
  State extends BaseState,
  Reducers extends BaseReducers<State>,
  Getters extends BaseGetters<State>
> {
  private _collection?: StoreCollection<any>
  private _collectionKey?: string
  private _state: State
  private _initialState: State
  private _reducers: Reducers
  private _getters?: Getters
  private _subscriptions: Array<
    ({
      reducer,
      args,
      stateChange,
    }: {
      reducer: keyof Reducers
      args: Array<any>
      stateChange: Readonly<Partial<State>>
    }) => any
  >
  private _nextSubscriptions: Array<
    ({
      reducer,
      args,
      stateChange,
    }: {
      reducer: keyof Reducers
      args: Array<any>
      stateChange: Readonly<Partial<State>>
    }) => any
  >

  public commit = {} as {
    [RKey in keyof Reducers]: (...args: Args<Reducers[RKey]>) => ReturnType<Reducers[RKey]>
  }
  public get = {} as {
    [GKey in keyof Getters]: (...args: Args<Getters[GKey]>) => ReturnType<Getters[GKey]>
  }

  constructor(config: { state: State; reducers: Reducers; getters?: Getters }) {
    this._state = config.state
    this._initialState = { ...config.state }
    this._reducers = config.reducers
    this._getters = config.getters
    this._subscriptions = []
    this._nextSubscriptions = this._subscriptions
    this.initCommit()
    this.initGet()
  }

  // @ts-ignore
  private setCollection<Collection extends StoreCollection<any>>(
    colleciton: Collection,
    collectionKey: string
  ) {
    this._collection = colleciton
    this._collectionKey = collectionKey
  }

  private initCommit() {
    Object.entries(this._reducers).forEach(([reducerKey, reducer]) => {
      this.commit[reducerKey as keyof Reducers] = (...args: Args<typeof reducer>) => {
        const result = reducer(this._state, ...args)
        if (result && result !== this._state) {
          this.setState(result, reducerKey, args)
        }
        return result as ReturnType<Reducers[keyof Reducers]>
      }
    })
  }

  private initGet() {
    if (this._getters) {
      Object.entries(this._getters).forEach(([getterKey, getter]) => {
        this.get[getterKey as keyof Getters] = (...args: Args<typeof getter>) => {
          return getter(this._state, ...args)
        }
      })
    }
  }

  private notifyCollection(nextState: State) {
    if (this._collection && this._collectionKey) {
      ;(this._collection as any).onChildrenStateUpdate(this._collectionKey, nextState)
    }
  }

  private notifiySubscriptions(
    reducer: keyof Reducers,
    args: Array<any>,
    stateChange: Readonly<Partial<State>>
  ) {
    const listeners = (this._subscriptions = this._nextSubscriptions)
    listeners.forEach(listener => listener({ reducer, args, stateChange }))
  }

  private ensureCanMutateNextListeners = () => {
    if (this._nextSubscriptions === this._subscriptions) {
      this._nextSubscriptions = this._subscriptions.slice()
    }
  }

  public subscribe = (
    listener: ({
      reducer,
      args,
      stateChange,
    }: {
      reducer: keyof Reducers
      args: Array<any>
      stateChange: Readonly<Partial<State>>
    }) => any
  ) => {
    let isSubscribed = true

    this.ensureCanMutateNextListeners()
    this._nextSubscriptions.push(listener)

    const unsubscribe = () => {
      if (!isSubscribed) return

      isSubscribed = false

      this.ensureCanMutateNextListeners()
      const index = this._nextSubscriptions.indexOf(listener)
      this._nextSubscriptions.splice(index, 1)
    }

    return unsubscribe
  }

  public setState(state: Partial<State>, reducerName: string = 'setState', args: any[] = []) {
    this.notifyCollection((this._state = { ...this._state, ...state }))
    this.notifiySubscriptions(reducerName, args, state)
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

  get collection(): Readonly<StoreCollection<any>> {
    if (!this._collection) throw new Error('Accessing undefined property `collection`')
    return this._collection
  }
}

/**
 * -----------------------
 * Store Collection
 * -----------------------
 */

export interface BaseStores {
  [storeName: string]: Store<any, any, any> | StoreCollection<BaseStores>
}

export class StoreCollection<Stores extends BaseStores> {
  private _collection?: StoreCollection<any>
  private _collectionKey?: string
  private _state = {} as {
    [STKey in keyof Stores]: Stores[STKey]['state']
  }
  private _initialState = {} as {
    [STKey in keyof Stores]: Stores[STKey]['initialState']
  }

  public commit = {} as {
    [STKey in keyof Stores]: Stores[STKey]['commit']
  }
  public get = {} as {
    [STKey in keyof Stores]: Stores[STKey]['get']
  }

  constructor(private stores: Stores) {
    Object.keys(this.stores).forEach((storeName: keyof Stores) => {
      const store = this.getStore(storeName)
      ;(store as any).setCollection(this, storeName)
      this._state[storeName] = store.state
      this._initialState[storeName] = store.initialState
      this.commit[storeName] = store.commit
      this.get[storeName] = store.get
    })
  }

  // @ts-ignore
  private setCollection<Collection extends StoreCollection<any>>(
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

  private notifyCollection(nextState: { [STKey in keyof Stores]: Stores[STKey]['state'] }) {
    if (this._collection && this._collectionKey) {
      this._collection.onChildrenStateUpdate(this._collectionKey, nextState)
    }
  }

  public subscribe(
    listener: ({
      storeName,
      reducer,
      args,
      stateChange,
    }: {
      storeName: keyof Stores
      reducer: string | number | symbol
      args: Array<any>
      stateChange: Readonly<BaseState>
    }) => any
  ) {
    const unsubscribes = Object.keys(this.stores).map(storeName => {
      return this.getStore(storeName).subscribe(({ reducer, args, stateChange }) => {
        return listener({ reducer, args, stateChange, storeName })
      })
    })

    return () => unsubscribes.map(unsubscribe => unsubscribe())
  }

  public resetState() {
    Object.keys(this.stores).forEach((storeName: keyof Stores) => {
      this.getStore(storeName).resetState()
    })
  }

  get state(): Readonly<{ [STKey in keyof Stores]: Stores[STKey]['state'] }> {
    return this._state
  }

  get initialState(): Readonly<{ [STKey in keyof Stores]: Stores[STKey]['initialState'] }> {
    return this._initialState
  }

  get collection(): Readonly<StoreCollection<any>> {
    if (!this._collection) throw new Error('Accessing undefined property `collection`')
    return this._collection
  }

  public getStore<ST extends keyof Stores>(storeName: ST): Stores[ST] {
    return this.stores[storeName]
  }
}
