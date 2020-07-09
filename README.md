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
import {
  createStore,
  createReducerCreator,
  createActionCreator,
  createGetterCreator,
} from '@anew/store'

const CounterStore = createStore({ count: 1 })

// Property creators use the currying technique to create props for the store
const createCounterReducer = createReducerCreator(CounterStore)
const createCounterAction = createActionCreator(CounterStore)
const createCounteGetter = createGetterCreator(CounterStore)

// A CounterStore reducer for updating the state using a pure function
const increment = createCounterReducer((state, add: number = 1) => ({
  count: state.count + add,
}))

// Alternatively you can create a named reducer, which is assigned the the
// `methodName` arg in a subscriber.
// `createCounterReducer('decrement', (state, minus: number = 1)) => {})`
const decrement = createCounterReducer((state, minus: number = 1) => {
  return {
    count: state.count - minus,
  }
})

// A CounterStore action for calling reducers asynchronously.
// As metioned in the reducer comment above, the action name
// can be passed as the first arg: `createCountAction('<ACTION_NAME>', (...args) => {...})
const incrementSync = createCounterAction(async (...args: any) => {
  // In actions, reducer calls are batched to trigger
  // one change event when possible
  increment()
  increment()

  const add = await someExampleFetchMethod()

  // The following reducer calls are not batched and trigger 2 change events
  // since they are called after the action returns and once the await resolves
  increment(add)
  increment(add)

  // You can explicitly batch reducers calls by wrapping the calls with `group`
  // and `groupEnd`: which is essentially what the action creator does.
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
2. Using the `createStore` function that takes the state as its only argument leaving out reducers, actions, and getters to be defined functionally using the following methods, `createReducerCreator`, `createActionCreator`, and `createGetterCreator`.

Both approaches have their pros and cons. Using `new Store(...)` ensures store specific logic is strongly coupled and is always shipped together making it easier to access functionality. Using `createStore(...)` (preferred) decouples the store allowing for separation of logic and allows you to import functionality as needed.

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

`actions`: impure functions that handle operations that fall inside and outside the store. They are mainly used to handle **async** operations that call reducers upon completion. Actions receive an exposed store object with public properties.

`getters`: pure functions that return a state slice or some derived state.

```js
const store = new Store({
  state: {
    count: 1,
    items: [],
  },

  reducers: {
    inc(state, add: number = 1) {
      return {
        count: state.count + add,
      }
    },

    push(state, add: number = 1) {
      return {
        items: [...state.items, add],
      }
    },
  },

  actions: {
    incSync(add: number) {
      setTimeout(() => {
        store.reducers.inc(add)
      }, 1000)
    },
  },

  getters: {
    countMult(state, mult: number = 2) {
      return state.count * mult
    },
  },
})

store.reducers.inc(2) // => { count: 3 }
store.reducers.push() // => { items: [1] }

store.actions.incSync(1) // => { count: 4 }

store.getters.countMult(3) // => 12
```

## Inspiration

1. [redux](https://redux.js.org/)
2. [vuex](https://vuex.vuejs.org)
