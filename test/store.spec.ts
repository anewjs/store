import Store, {
  StoreCollection,
  createReducerCreator,
  createGetterCreator,
  createActionCreator,
} from '..'

const counterStore = new Store({
  state: {
    count: 0,
    flag: false,
  },

  reducers: {
    increment(state, amount: number = 1) {
      if (amount < 100) {
        return {
          count: state.count + amount,
        }
      }
      if (amount === 100) {
        return state
      }
    },
  },

  actions: {
    incrementThree: (amount: number) => {
      counterStore.reducers.increment(amount)
      counterStore.reducers.increment(amount)
      counterStore.reducers.increment(amount)
      counterStore.setState({ flag: true })
    },

    dummy: () => {},
  },

  getters: {
    countPlus(state, plus: number) {
      return state.count + plus
    },
  },
})

const todoStore = new Store({
  state: {
    todo: [],
  },

  reducers: {
    addTodo(state, todo: { text: string; completed: boolean }) {
      return {
        todo: [...state.todo, todo],
      }
    },
  },
})

const increment = createReducerCreator(counterStore)(
  'incrementAlt',
  (state, amount: number = 1) => {
    if (amount < 100) {
      return {
        count: state.count + amount,
      }
    }
  }
)

const countPlus = createGetterCreator(counterStore)((state, plus: number) => {
  return state.count + plus
})

const incrementSync = createActionCreator(counterStore)((amount: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      counterStore.reducers.increment(amount)
      resolve()
    }, 1000)
  })
})

const store = new StoreCollection({
  counter: counterStore,
  todo: todoStore,
})

const wrapperStore = new StoreCollection({
  wrapped: store,
})

describe('Store and StoreCollection', () => {
  beforeEach(() => {
    store.resetState()
  })

  test('state', () => {
    const actual = store.state
    const expected = {
      counter: {
        count: 0,
        flag: false,
      },
      todo: {
        todo: [],
      },
    }

    expect(actual).toEqual(expected)
    expect(store.state.counter).toEqual(counterStore.state)
  })

  test('reducers', () => {
    increment()
    const before = store.state.counter.count
    const beforeFromChild = counterStore.state.count
    store.reducers.counter.increment()
    counterStore.reducers.increment()
    const after = store.state.counter.count
    const afterFromChild = counterStore.state.count
    const afterFromWrapper = wrapperStore.state.wrapped.counter.count
    const expectedBefore = 1
    const expectedAfter = 3

    expect(before).toBe(expectedBefore)
    expect(after).toBe(expectedAfter)
    expect(beforeFromChild).toBe(expectedBefore)
    expect(afterFromChild).toBe(expectedAfter)
    expect(afterFromWrapper).toBe(expectedAfter)
  })

  test('reducer named', () => {
    const mockFuncForCounter = jest.fn()
    counterStore.subscribe(mockFuncForCounter)

    increment(15)

    expect(mockFuncForCounter).toBeCalledTimes(1)
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [15],
        methodType: 'reducer',
        methodName: 'incrementAlt',
        stateChange: { count: 15 },
      })
    )
  })

  test('action state change', () => {
    const mockFuncForCounter = jest.fn()
    counterStore.subscribe(mockFuncForCounter)

    counterStore.actions.incrementThree(1)

    expect(mockFuncForCounter).toBeCalledTimes(1)
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [1],
        methodType: 'action',
        methodName: 'incrementThree',
        stateChange: { count: 3, flag: true },
      })
    )
  })

  test('getters', () => {
    const before = store.getters.counter.countPlus(1)
    const beforeFromChild = counterStore.getters.countPlus(1)
    const beforeGettersCreator = countPlus(1)
    store.reducers.counter.increment()
    const after = store.getters.counter.countPlus(1)
    const afterFromChild = counterStore.getters.countPlus(1)
    const afterGettersCreator = countPlus(1)
    const expectedBefore = 1
    const expectedAfter = 2

    expect(before).toBe(expectedBefore)
    expect(after).toBe(expectedAfter)
    expect(beforeFromChild).toBe(expectedBefore)
    expect(afterFromChild).toBe(expectedAfter)
    expect(beforeGettersCreator).toBe(expectedBefore)
    expect(afterGettersCreator).toBe(expectedAfter)
  })

  test('subscribe', () => {
    const mockFunc = jest.fn()
    const mockFuncForCounter = jest.fn()
    const mockFuncForTodo = jest.fn()
    const unsubscribe = store.subscribe(mockFunc)
    counterStore.subscribe(mockFuncForCounter)
    todoStore.subscribe(mockFuncForTodo)
    store.reducers.counter.increment(1)
    store.reducers.counter.increment(2)
    store.reducers.counter.increment(3)
    store.reducers.counter.increment(100)
    store.reducers.counter.increment(101)
    store.actions.counter.dummy()
    unsubscribe()
    store.reducers.counter.increment(3)
    expect(mockFunc).toBeCalledTimes(3)
    expect(mockFunc).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [1],
        methodType: 'reducer',
        methodName: 'increment',
        stateChange: { count: 1 },
        storeName: 'counter',
      })
    )
    expect(mockFunc).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [2],
        methodType: 'reducer',
        methodName: 'increment',
        stateChange: { count: 3 },
        storeName: 'counter',
      })
    )
    expect(mockFunc).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [3],
        methodType: 'reducer',
        methodName: 'increment',
        stateChange: { count: 6 },
        storeName: 'counter',
      })
    )
    expect(mockFuncForCounter).toBeCalledTimes(4)
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [1],
        methodType: 'reducer',
        methodName: 'increment',
        stateChange: { count: 1 },
      })
    )
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [2],
        methodType: 'reducer',
        methodName: 'increment',
        stateChange: { count: 3 },
      })
    )
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        methodArgs: [3],
        methodType: 'reducer',
        methodName: 'increment',
        stateChange: { count: 6 },
      })
    )
    expect(mockFuncForTodo).toBeCalledTimes(0)
  })

  test('actions', async () => {
    await incrementSync(1)
    const actual = store.state.counter.count
    const actualFromChild = store.state.counter.count
    const expected = 1

    expect(actual).toBe(expected)
    expect(actualFromChild).toBe(expected)
  })

  test('action grouped', () => {
    const mockFunc = jest.fn()
    counterStore.subscribe(mockFunc)
    counterStore.actions.incrementThree(1)
    store.actions.counter.incrementThree(1)

    expect(mockFunc).toBeCalledTimes(2)
  })

  test('reducer group', () => {
    const mockFunc = jest.fn()
    counterStore.subscribe(mockFunc)

    counterStore.group()
    counterStore.reducers.increment()
    counterStore.reducers.increment()
    counterStore.reducers.increment()
    counterStore.reducers.increment()
    counterStore.reducers.increment()
    counterStore.groupEnd()

    expect(mockFunc).toBeCalledTimes(1)
  })

  test('store group', () => {
    const mockFunc = jest.fn()
    const mockCounterFunc = jest.fn()
    const mockTodoFunc = jest.fn()
    store.subscribe(mockFunc)
    counterStore.subscribe(mockCounterFunc)
    todoStore.subscribe(mockTodoFunc)

    store.group()
    counterStore.reducers.increment()
    todoStore.reducers.addTodo({ text: '', completed: false })
    store.groupEnd()

    expect(mockFunc).toBeCalledTimes(1)
    expect(mockCounterFunc).toBeCalledTimes(1)
    expect(mockTodoFunc).toBeCalledTimes(1)
  })

  test('store not group', () => {
    const mockFunc = jest.fn()
    const mockCounterFunc = jest.fn()
    const mockTodoFunc = jest.fn()
    store.subscribe(mockFunc)
    counterStore.subscribe(mockCounterFunc)
    todoStore.subscribe(mockTodoFunc)

    counterStore.reducers.increment()
    todoStore.reducers.addTodo({ text: '', completed: false })

    expect(mockFunc).toBeCalledTimes(2)
    expect(mockCounterFunc).toBeCalledTimes(1)
    expect(mockTodoFunc).toBeCalledTimes(1)
  })

  test('resetState', async () => {
    const counterMock = jest.fn()
    const todoMock = jest.fn()
    const storeMock = jest.fn()
    counterStore.subscribe(counterMock)
    store.subscribe(storeMock)
    todoStore.subscribe(todoMock)
    const beforeCommit = store.state
    store.reducers.counter.increment()
    store.reducers.todo.addTodo({ text: 'test', completed: false })
    const afterCommit = store.state
    counterStore.resetState()
    const afterReset = store.state

    const expectedBeforeCommit = {
      counter: { count: 0, flag: false },
      todo: { todo: [] },
    }
    const expectedAfterCommit = {
      counter: { count: 1, flag: false },
      todo: { todo: [{ text: 'test', completed: false }] },
    }
    const expectedAfterReset = {
      counter: { count: 0, flag: false },
      todo: { todo: [{ text: 'test', completed: false }] },
    }

    expect(beforeCommit).toEqual(expectedBeforeCommit)
    expect(afterCommit).toEqual(expectedAfterCommit)
    expect(afterReset).toEqual(expectedAfterReset)
    expect(counterMock).toBeCalledTimes(2)
    expect(todoMock).toBeCalledTimes(1)
    expect(storeMock).toBeCalledTimes(3)
  })

  test('accessing collection', () => {
    expect(() => counterStore.collection).not.toThrow()
    expect(() => wrapperStore.collection).toThrowError(/Accessing undefined property `collection`/)
  })

  test('setState', () => {
    const counterMock = jest.fn()
    const storeMock = jest.fn()
    counterStore.subscribe(counterMock)
    store.subscribe(storeMock)
    counterStore.setState({ count: 1000 })

    const actual = store.state.counter.count
    const actualFromChild = counterStore.state.count
    const expected = 1000

    expect(actual).toBe(expected)
    expect(actualFromChild).toBe(expected)
    expect(counterMock).toBeCalledTimes(1)
    expect(storeMock).toBeCalledTimes(1)
  })
})
