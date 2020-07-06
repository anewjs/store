import Store, { StoreCollection } from '..'

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

export const incrementSync = (amount: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      store.commit.counter.increment(amount)
      resolve()
    }, 1000)
  })
}

export const incrementSyncFromChild = (amount: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      counterStore.commit.increment(amount)
      resolve()
    }, 1000)
  })
}

export const addTodoSync = (todo: { text: string; completed: boolean }) => {
  return new Promise(resolve => {
    setTimeout(() => {
      todoStore.commit.addTodo(todo)
      resolve()
    }, 1000)
  })
}

export const store = new StoreCollection({
  counter: counterStore,
  todo: todoStore,
})

export const wrapperStore = new StoreCollection({
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

  test('commit', () => {
    const before = store.state.counter.count
    const beforeFromChild = counterStore.state.count
    store.commit.counter.increment()
    counterStore.commit.increment()
    const after = store.state.counter.count
    const afterFromChild = counterStore.state.count
    const afterFromWrapper = wrapperStore.state.wrapped.counter.count
    const expectedBefore = 0
    const expectedAfter = 2

    expect(before).toBe(expectedBefore)
    expect(after).toBe(expectedAfter)
    expect(beforeFromChild).toBe(expectedBefore)
    expect(afterFromChild).toBe(expectedAfter)
    expect(afterFromWrapper).toBe(expectedAfter)
  })

  test('get', () => {
    const before = store.get.counter.countPlus(1)
    const beforeFromChild = counterStore.get.countPlus(1)
    store.commit.counter.increment()
    const after = store.get.counter.countPlus(1)
    const afterFromChild = counterStore.get.countPlus(1)
    const expectedBefore = 1
    const expectedAfter = 2

    expect(before).toBe(expectedBefore)
    expect(after).toBe(expectedAfter)
    expect(beforeFromChild).toBe(expectedBefore)
    expect(afterFromChild).toBe(expectedAfter)
  })

  test('subscribe', () => {
    const mockFunc = jest.fn()
    const mockFuncForCounter = jest.fn()
    const mockFuncForTodo = jest.fn()
    store.subscribe(mockFunc)
    counterStore.subscribe(mockFuncForCounter)
    todoStore.subscribe(mockFuncForTodo)
    store.commit.counter.increment(1)
    store.commit.counter.increment(2)
    store.commit.counter.increment(3)
    store.commit.counter.increment(100)
    store.commit.counter.increment(101)
    expect(mockFunc).toBeCalledTimes(3)
    expect(mockFunc).toBeCalledWith(
      expect.objectContaining({
        args: [1],
        reducer: 'increment',
        stateChange: { count: 1 },
        storeName: 'counter',
      })
    )
    expect(mockFunc).toBeCalledWith(
      expect.objectContaining({
        args: [2],
        reducer: 'increment',
        stateChange: { count: 3 },
        storeName: 'counter',
      })
    )
    expect(mockFunc).toBeCalledWith(
      expect.objectContaining({
        args: [3],
        reducer: 'increment',
        stateChange: { count: 6 },
        storeName: 'counter',
      })
    )
    expect(mockFuncForCounter).toBeCalledTimes(3)
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        args: [1],
        reducer: 'increment',
        stateChange: { count: 1 },
      })
    )
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        args: [2],
        reducer: 'increment',
        stateChange: { count: 3 },
      })
    )
    expect(mockFuncForCounter).toBeCalledWith(
      expect.objectContaining({
        args: [3],
        reducer: 'increment',
        stateChange: { count: 6 },
      })
    )
    expect(mockFuncForTodo).toBeCalledTimes(0)
  })

  test('actions', async () => {
    await incrementSync(1)
    await incrementSyncFromChild(1)
    const actual = store.state.counter.count
    const actualFromChild = store.state.counter.count
    const expected = 2

    expect(actual).toBe(expected)
    expect(actualFromChild).toBe(expected)
  })

  test('resetState', async () => {
    const counterMock = jest.fn()
    const todoMock = jest.fn()
    const storeMock = jest.fn()
    counterStore.subscribe(counterMock)
    store.subscribe(storeMock)
    todoStore.subscribe(todoMock)
    const beforeCommit = store.state
    store.commit.counter.increment()
    store.commit.todo.addTodo({ text: 'test', completed: false })
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
