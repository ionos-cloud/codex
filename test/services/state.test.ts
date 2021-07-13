import { expect } from 'chai'

import mocks from '../mocks'

import mock = require('mock-fs')
import state, { idleState } from '../../src/services/state'

describe('state tests', () => {

  beforeEach(() => {
    mock(mocks.state.idleMock)
    state.load()
  })

  afterEach(() => {
    mock.restore()
  })

  it('should load the state correctly', () => {
    expect(state.get()).to.deep.equal(idleState)
  })

  it('should set an idle state correctly', () => {
    state.setIdle().save()
    expect(state.get()).to.deep.equal(idleState)
  })

})
