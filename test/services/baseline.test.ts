import { expect } from 'chai'
import mock = require('mock-fs')
import * as baseline from '../../src/services/baseline'
import * as config from '../../src/services/config'

describe('baseline tests', function () {
  it('should read the baseline correctly', () => {
    const content = 'foo'
    mock({
      [config.getBaselinePath(5)]: content
    })

    expect(baseline.read(5)).to.equal(content)

    mock.restore()
  })

  it('should read the baseline as a JSON', () => {
    const content = {foo: 'bar'}
    mock({
      [config.getBaselinePath(5)]: JSON.stringify(content)
    })

    expect(baseline.readJSON(5)).to.deep.equal(content)

    mock.restore()
  })

  it('should get the patch level', () => {
    const level = 4
    const content = {info: {version: `v5.0-SDK.${level}`}}
    mock({
      [config.getBaselinePath(5)]: JSON.stringify(content)
    })

    expect(baseline.getPatchLevel(5)).to.equal(level)

    mock.restore()
  })

  it('should get a 0 patch level when there\'s none', () => {
    const content = {info: {version: 'v5.0'}}
    mock({
      [config.getBaselinePath(5)]: JSON.stringify(content)
    })

    expect(baseline.getPatchLevel(5)).to.equal(0)

    mock.restore()
  })

  it('should throw when there\'s no version info', () => {
    const content = {info: 'foo'}
    mock({
      [config.getBaselinePath(5)]: JSON.stringify(content)
    })

    expect(() => baseline.getPatchLevel(5)).to.throw()

    mock.restore()
  })

  it('should return 0 when there\'s an invalid patch level', () => {
    const content = {info: {version: 'v5.0-SDK.foo'}}
    mock({
      [config.getBaselinePath(5)]: JSON.stringify(content)
    })

    expect(baseline.getPatchLevel(5)).to.equal(0)

    mock.restore()
  })
});
