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

  it('should read the patch level', () => {
    const level = 3
    const content = {info: {version: `v5.0-SDK.${level}`}}
    mock({
      [config.getBaselinePath(5)]: JSON.stringify(content)
    })

    expect(baseline.getPatchLevel(5)).to.deep.equal(level)

    mock.restore()
  })
});
