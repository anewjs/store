import invariant from 'invariant'

import createStore, { combineStores, createTestEnv, ActionTypes } from '../'

jest.mock('invariant')

describe('combineStores', () => {
    test('create empty store', () => {})
})
