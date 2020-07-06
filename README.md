# Anew Store

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

## Docs

```js
import Store from '@anew/store'

const store = new Store({
    state: Object,
    reducers: Object,
    getters?: Object,
})
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
