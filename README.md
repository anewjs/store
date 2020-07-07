# `@anew/store`

> A lightweight robust predictable state container

## Updates

For updates checkout [Change Log](https://github.com/anewjs/store/blob/master/CHANGELOG.md).

## Installation

To install `anew` directly into your project run:

```
npm i @anew/store -S
```

for yarn users, run:

```
yarn add @anew/store
```

## Usage

```js
import { createStore, createReducer, createAction, createGetter } from '@anew/store'

const CounterStore = createStore({ count: 1 })

// Property creators use the currying technique to create props for the store
const createCounterReducer = createReducer(CounterStore)
const createCounterAction = createAction(CounterStore)
// `createActionWithStore` is exactly the same as `createAction` but passes the store as
// the first argument for convenience (saves from an extra import)
const createCounterActionWithStore = createActionWithStore(CounterStore)
const createCounteGetter = createGetter(CounterStore)

// CounteStore reducers for updating using pure functions
const increment = createCounterReducer((state, add: number = 1) => ({
  count: state.count + add,
}))

const decrement = createCounterReducer((state, minus: number = 1) => ({
  count: state.count - minus,
}))

// CounterStore actions for calling reducers asynchronously.
// Multiple reducer calls are batched and trigger a single change event when possibly
const incrementSync = createCounterAction(async (...args: any) => {
  // The following reducer calls are batched and trigger one change event
  increment()
  increment()

  const add = await someExampleFetchMethod()

  // The follow reducer calls are not batched and trigger 2 change events
  // since they are called after the action returns and once the await resolves
  increment(add)
  increment(add)

  // You can explicitly batch reducers calls as follows:
  CounterStore.group()
  increment(add)
  increment(add)
  CounterStore.groupEnd()
})

// CounterStore getters for getting a state prop or some derived state value
const getCountMult = createCounteGetter((state, mult: number = 2) => {
  return state.count * mult
})
```

## Docs

There are two ways to create a store:

1. Creating a store instance along with it's state, reducers, actions, and getters under the same instance.
2. Using the `createStore` function that takes the state as its only argument leaving out reducers, actions, and getters to be defining funtionally using the following methods, `createReducer`, `createAction` or `createActionWithStore`, and `createGetter`.

Both approaches have their pros and cons. Using the store instances ensures store specific logic is strongly coupled and is always shipped together making it easier to access functionality. Using the (preferred) functional approach decouples the store allowing for separation of logic and allows you to import functionality as needed.

```js
import Store, { createStore } from '@anew/store'

const storeA = new Store({
    state: Object,
    reducers?: Object,
    actions?: Object,
    getters?: Object,
})

const storeB = createStore(state: Object)
```

### Parameters

`state`: the initial state object for the store.

`reducers`: pure functions, defined under a strict namespace, that return the next state tree for a specific store. Reducers receive the store's current state tree with an optional payload list as parameters. In addition, reducers that fall under an outside namepsace can also be defined inside the store and get passed both the current and defined namespace states.

```js
// Creation
const store = new Store({
  state: {
    count: 1,
    items: [],
  },

  reducers: {
    inc: (state, add: number = 1) => ({
      count: state.count + add,
    }),

    push: (state, add: number = 1) => ({
      items: [...state.items, add],
    }),
  },
})

// Usage
store.commit.inc(2) // => { count: 3 }
store.commit.push() // => { items: [1] }
```

`getters`: pure functions that return a state slice or some derived state.

```js
// Creation
const store = new Store({
  state: {
    someStateProp: 1,
    anotherStateProp: 2,
  },

  getters: {
    someStateProp: state => state.someStateProp,
    anotherStateProp: state => state.anotherStateProp,
  },
})

// Usage
store.get.someStaateProp() // => 1
```

## Inspiration

1. [redux](https://redux.js.org/)
2. [vuex](https://vuex.vuejs.org)
