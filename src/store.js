import { createSelector } from 'reselect'

export default class Store {
    constructor(options) {
        this.use(options)
    }

    use({ state = {}, reducers = {}, actions = {}, getters = {}, selectors = {}, on = {}, modules } = {}) {
        // Nested Default
        if (!on.dispatch) on.dispatch = () => null
        if (!on.commit) on.commit = () => null
        if (!on.update) on.update = () => null

        // Assign Options
        this.state = state
        this.reducers = reducers
        this.actions = actions
        this.getters = getters
        this.selectors = selectors
        this.on = on

        // Initialize Store
        this.initStore()

        // Install Options (From, To, ..args)
        this.installModules(modules, this)
        this.installGetters(getters, this.get, this.get)
        this.installSelectors(selectors, this.select, this)
        this.installReducers(reducers, this.commit, this.state, this.get)
        this.installActions(actions, this.dispatch, this)
    }

    initStore() {
        this.select = {}
        this.stage.commit = this.stageCommit
    }

    installModules(modules = {}, storage) {
        Object.entries(modules).forEach(([moduleName, module]) => {
            if (module.state === undefined) module.state = {}

            Object.keys(module).forEach(type => {
                switch (type) {
                    case 'modules':
                        this.installModules(module.modules, module)
                        break
                    default:
                        storage[type][moduleName] = module[type]
                        break
                }
            })
        })
    }

    installGetters(getters, storage, getState) {
        Object.entries(getters).forEach(([getName, get]) => {
            switch (typeof get) {
                case 'function':
                    storage[getName] = (...args) => get(getState(), ...args)
                    break
                case 'object':
                    storage[getName] = () => getState()[getName]
                    this.installGetters(get, storage[getName], storage[getName])
                    break
            }
        })
    }

    installSelectors(selectors, storage, store) {
        Object.entries(selectors).forEach(([selectorName, selector]) => {
            switch (typeof selector) {
                case 'function':
                    const memoizedSelector = createSelector(...selector(store))
                    storage[selectorName] = () => memoizedSelector(store.get())
                    break
                case 'object':
                    storage[selectorName] = {}

                    this.installSelectors(selector, storage[selectorName], {
                        get: store.get[selectorName],
                        select: store.select[selectorName],
                        core: this,
                    })
                    break

            }
        })
    }

    installReducers(reducers, storage, state, getState, prefix = '', isLevelUp) {
        Object.entries(reducers).forEach(([reducerName, reducer]) => {
            switch (typeof reducer) {
                case 'function':
                    if (isLevelUp) {
                        const stateKey = prefix.replace(/\/$/, '')

                        storage[reducerName] = (...args) => {
                            this.commit('+' + prefix + reducerName, ...args)
                            return (state[stateKey] = this.updateState(state[stateKey], reducer(getState(), ...args)))
                        }
                    } else {
                        storage[reducerName] = (...args) => {
                            this.commit('+' + prefix + reducerName, ...args)
                            return this.updateState(state, reducer(getState(), ...args))
                        }
                    }
                    break
                case 'object':
                    storage[reducerName] = {}
                    const isObject = typeof state[reducerName] === 'object'
                    this.installReducers(reducer, storage[reducerName], isObject ? state[reducerName] : state, () => getState()[reducerName], prefix + reducerName + '/', !isObject)
                    break
            }
        })
    }

    installActions(actions, storage, store, prefix = '') {
        Object.entries(actions).forEach(([actionName, action]) => {
            switch (typeof action) {
                case 'function':
                    storage[actionName] = (...args) => {
                        this.dispatch('+' + prefix + actionName, ...args)
                        return action(store, ...args)
                    }
                    break
                case 'object':
                    storage[actionName] = {}
                    this.installActions(action, storage[actionName], {
                        select: store.select[actionName],
                        get: store.get[actionName],
                        dispatch: store.dispatch[actionName],
                        commit: store.commit[actionName],
                        stage: this.stage,
                        core: this,
                    }, prefix + actionName + '/')
                    break
            }
        })
    }

    /**
    | ------------------
    | Store Methods
    | ------------------
    | Exposed API
    |
    */

    get = () => {
        return this.state
    }

    dispatch = (action, ...args) => {
        this.on.dispatch(action, args)

        if(action[0] === '+') return

        const paths = action.split('/')
        const lastPathIndex = paths.length - 1

        return paths.reduce((actionObj, path, i) => {
            if (i === lastPathIndex) {
                return actionObj[0][path](actionObj[1], ...args)
            }

            return [
                actionObj[0][path],
                {
                    select: actionObj[1].select[path],
                    get: actionObj[1].get[path],
                    dispatch: actionObj[1].dispatch[path],
                    commit: actionObj[1].commit[path],
                    stage: this.stage,
                    core: this,
                }
            ]
        }, [this.actions, this])
    }

    commit = (reducer, ...args) => {
        this.on.commit(reducer, args)

        if (reducer[0] === '+') return

        const paths = reducer.split('/')
        const lastPathIndex = paths.length - 1

        let nextState = this.state
        let levelUp

        return paths.reduce((reducerObj, path, i) => {
            if (i === lastPathIndex) {
                if (levelUp) {
                    return (nextState[levelUp] = this.updateState(nextState[levelUp], reducerObj[path](nextState[levelUp], ...args)))
                } else {
                    return this.updateState(nextState, reducerObj[path](nextState, ...args))
                }
            }

            if (i === lastPathIndex - 1 && typeof nextState[path] !== 'object') {
                levelUp = path
            } else {
                nextState = nextState[path]
            }

            return reducerObj[path]
        }, this.reducers)
    }

    stage = () => {
        this.isStaging = true
        this.on.commit('@anew/STAGE_START')
    }

    stageCommit = () => {
        this.isStaging = false
        this.on.commit('@anew/STAGE_COMPLETE')
    }

    /**
    | ------------------
    | Internal API
    | ------------------
    |
    */

    updateState = (state, change) => {
        if (change && change !== state) {
            this.on.update(state)

            if (typeof state === 'object') {
                state = Object.assign(state, change)
            } else {
                state = change
            }
        }

        return state
    }
}