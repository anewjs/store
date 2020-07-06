# Change Log

This project adheres to [Semantic Versioning](http://semver.org/).

## v2.7.0 (2020-07-05)

- Reimplementing store with typescript
- BREAKING: removed actions in favor of external functions with reference to store as follows:

```js
const store = new Store({
  state: {
    count: 0,
  },
  reducers: {
    inc({ count }) {
      return { count: count++ }
    },
  },
})

function incSync() {
  setTimeout(() => {
    store.commit.inc()
  }, 1000)
}
```

- BREAKING: removed selectors in favor of using reselect

```js
import { createSelector } from 'reselect'

const store = new Store({
  state: {
    count: 0,
  },
  getters: {
    count(state) {
      return state.count
    },
  },
})

const countSelector = createSelector(store.get.count)
countSelector(store.state) // => 1
```

- BREAKING: removed modules in favor of using `new StoreCollection(...)`

## v2.4.0 (2019-11-04)

- Introducing the new API component within the store architecture. Check out the README for details.

## v2.2.1 (2019-03-06)

- Fixed edge case where listeners would incorrectly set `stateHasChanged` flag to false [\#8d9af16](https://github.com/anewjs/store/commit/8d9af16b81b3d311404c3bc47e4224e37b8b6a09)
