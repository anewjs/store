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
    state: Any,
    reducers: Object,
    actions: Object,
    getters: Object,
    selectors: Object,
    modules: Object,
    listeners: Object,
    api: Object,
    plugins: Array,
    enhance: Object,
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
        inc: (state, add = 1) => ({
            count: state.count + add,
        }),

        push: (state, add = 1) => ({
            items: [...state.items, add],
        }),
    },
})

// Usage
store.commit.inc(2) // => { count: 3, items: [] }
store.commit.push() // => { count: 3, items: [1] }
```

`actions`: impure functions that handle operations that fall inside and outside the store. They are mainly used to handle **async** operations that commit reducers upon completion. Actions receive an exposed store object with public properties.

```js
// Creation
const store = new Store({
    state: {
        isFetching: false,
        firstName: '',
        lastName: '',
    },

    reducers: {
        getUserSent: () => ({
            isFetching: true,
        }),

        getUserSuccess: (state, firstName, lastName) => ({
            firstName,
            lastName,
            isFetching: false,
        }),

        getUserFailed: state => ({
            isFetching: false,
        }),
    },

    actions: {
        getUser(store, username) {
            const {
                get, // get state from getters
                select, // get state from selectors
                dispatch, // Dispatch an action
                commit, // commit a reducer
                core, // Access ^ above properties at core (root) store level
            } = store

            store.commit.getUserSent()

            fetch(`/get/user/info/${username}`)
                .then(user => {
                    store.commit.getUserSuccess(user.firstName, user.lastName)
                })
                .catch(err => {
                    store.commit.getUserFailed()
                })
        },
    },
})

// Usage
store.dispatch.getUser('someUserName')
```

`getters`: pure functions that return a state slice or some derived state.

`selectors`: a memoized getter using [reselect](https://github.com/reduxjs/reselect).

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

    selectors: {
        totalStateProp: store => [
            store.get.someStateProp,
            store.get.anotherStateProp,
            store.prop('shouldDouble', false),

            (someStateProp, anotherStateProp, shouldDouble) => {
                const total = someStateProp + anotherStateProp

                return shouldDouble ? total * 2 : total
            },
        ],
    },
})

// Usage
store.get.someStaateProp() // => 1
store.select.totalStateProp({ shouldDouble: false }) // => 6
```

`modules`: include children stores under a single store.

```js
// Creation
const store = new Store({
    state: {
        rootStateProp: 1,
    },

    modules: {
        counter: {
            state: {
                count: 1,
            },

            // ...more store prop
        },

        list: {
            state: {
                items: [],
            },

            // ...more store prop
        },
    },

    // ...more store prop
})

/**
 | --------------
 | Result
 | --------------
 | store.state = { 
 |   rooStateProp: 1, 
 |   counter: {
 |     count: 1,
 |   },
 |   list: {
 |     items: [],
 |   },
 | }
 |
 */
```

`listeners`: listen to reducer commit in a sibling store.

```js
const store = new Store({
    modules: {
        counter: {
            state: {
                count: 1,
            },

            reducers: {
                inc: ({ count }) => ({
                    count: count + 1,
                }),
            },
        },

        list: {
            state: {
                items: [],
            },

            listeners: {
                counter: {
                    // functions like an action
                    inc: (store, counterState, ...incArgs) => {
                        // Perform any async action
                    },

                    // ------------------ or ------------------

                    // return a function which functions like a reducer
                    inc: (store, counterState, ...incArgs) => state => ({
                        items: [...state.items, counterState.count],
                    }),
                },
            },
        },
    },
})
```


`api`: manage your application program interface (API) using the power @anew/store brings.

```js
// Ex. Using firestore
const store = new Store({
    api: {
        collection: firestore.collection('users')
        
        /**
         * @param {Object} store the entire @anew/store
         **/
        getUsersByCompany(store, company) {
            return store.api.collection.where("company", "==", company)
        },
        
        async deleteUser(store, id) {
            await store.api.collection.doc(id).delete()
            // Access to other store api
            await store.core.api.accounts.deleteAccount(id)
        },
    },
})
```

`plugins`: Extend a stores functionality

```js
// Creation
const store = new Store({
    // ...other store props
    plugins: [
        // Logger Plugin
        store => {
            if (process.env.NODE_ENV !== 'production') {
                let prevState = {}

                // Logs action/reducer when store is triggered
                store.subscribe((action, args) => {
                    console.group(action)
                    console.log(`args:`, args)
                    console.log(`before:`, prevState)
                    console.log(`after:`, (prevState = JSON.parse(JSON.stringify(store.get()))))
                    console.groupEnd(action)
                })
            }
        },
    ],
})
```

`enhance`: Enhance store functionality.

## Dependencies

1. [reselect](https://github.com/reduxjs/reselect)

## Inspiration

1. [redux](https://redux.js.org/)
2. [vuex](https://vuex.vuejs.org)
