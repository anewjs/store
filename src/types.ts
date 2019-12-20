export interface Store {
    select: Select
    commit: Commit
    dispatch: Dispatch
    get: Get
    subscribe: Subscribe
}

export type Subscribe = (subscription: Subscription) => () => void

export interface Commit {
    (reducerPath: string, ...args: any[]): Commit
    push: (change: PushReducerArg) => ReturnType<PushReducer>
    stage: FunctionOf<void>
    [reducer: string]: Commit | Reducer | any
}

export interface Dispatch {
    (actionPath: string, ...args: any[]): any
    [action: string]: Dispatch | Action | any
}

export interface Get {
    (): State
    [getter: string]: Getter | any
}

export interface Select {
    (): void
    [selector: string]: Selector | any
}

export type Prop = {
    (propName: string, defaultValue?: any): SelectorGetters
}

// ------------------------------------------------------------------------
// *****************************General Types******************************
// ------------------------------------------------------------------------

export type ValueOf<T> = T[keyof T]

export interface FunctionOf<Type = any, Props = any> extends ObjectOf<Props> {
    (...args: any[]): Type
}

export interface ObjectOf<Type> {
    [key: string]: Type
    [key: number]: Type
}

export enum MutationType {
    ACTION = 'action',
    REDUCER = 'reducer',
}

// ------------------------------------------------------------------------
// ****************************Internal Types******************************
// ------------------------------------------------------------------------

export type StateHasChanged = boolean

export type IsStaging = boolean

export type Storage<T = any> = ObjectOf<T | Storage<T>>

// ------------------------------------------------------------------------
// ****************************External Types******************************
// ------------------------------------------------------------------------

export type State =
    | boolean
    | number
    | string
    | null
    | undefined
    | Array<State>
    | Set<State>
    | ObjectOf<State>

// Options

export interface Enhance {
    actions?: boolean
}

export interface Modules {
    [storeKey: string]: StoreOptions
}

export interface StoreOptions {
    state?: State
    reducers?: Redcuers
    getters?: Getters
    actions?: Actions
    listeners?: Listeners
    selectors?: Selectors
    api?: Apis
    enhance?: Enhance
    modules?: Modules
    plugins?: Plugins
}

// Method Args/ReturnTypes

export interface ApiStore {
    core?: ApiStore
    get: Get
    select: Selectors
    api: Apis
}

export interface SelectorStore {
    core?: SelectorStore
    get: Get
    prop: Prop
    select: Selectors
}

export interface ActionStore {
    core?: ActionStore
    commit: Commit
    dispatch: Dispatch
    get: Get
    select: Selectors
    api: Apis
}

export interface ListenerContext {
    store: ActionStore
    state: State
}

export interface PluginOptions {
    get: () => StoreOptions
    inject: (udpates: Partial<StoreOptions>) => void
}

export type PushReducerArg = Partial<State> | ((state: State) => Partial<State>)

export type SelectorGetters = (state: State, props: ObjectOf<any>) => any

export type SelectorFinalGetter<RT> = (...args: any[]) => RT

export type SelectorReturnType<RT> = (SelectorGetters | SelectorFinalGetter<RT>)[]

// Methods

export type Subscription = (path: string, args: any[], mutationType: MutationType) => void

export type Listener = (context?: ListenerContext, ...args: any[]) => PushReducerArg | any

export type ListenerWrapper = (state?: State, ...args: any[]) => void

export type Reducer = (state?: State, ...args: any[]) => Partial<State> | void

export type PushReducer = (state?: State, arg?: PushReducerArg) => ReturnType<Reducer>

export type Action<RT = void> = (store?: ActionStore, ...args: any[]) => RT

export type EnhancedAction = (store?: ActionStore, ...args: any[]) => undefined | PushReducerArg

export type Api<RT = Partial<State>> = (store?: ApiStore, ...args: any[]) => Promise<RT>

export type ApiListener = (store?: ApiStore, path?: string, args?: any[]) => void

export type Selector<RT = any> = (store?: SelectorStore) => SelectorReturnType<RT>

export type Getter<RT = Partial<State>> = (state?: State, ...args: any[]) => RT

export type Plugin = (store?: unknown, options?: PluginOptions) => void

// ObjectOf Methods

export type Listeners = ObjectOf<Listeners | Listener>

export type Redcuers = ObjectOf<Reducer>

export type Actions = ObjectOf<Action>

export type EnhancedActions = ObjectOf<EnhancedAction>

export type Apis = ObjectOf<Apis | Api> & {
    beforeRequest?: ApiListener
    afterRequest?: ApiListener
}

export type Getters = ObjectOf<Getter>

export type Selectors = ObjectOf<Selector | Selectors>

export type Subscriptions = Array<Subscription>

export type Plugins = Array<Plugin>

export type Listen = ObjectOf<ListenerWrapper>
