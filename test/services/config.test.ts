import { expect } from 'chai'
import * as config from '../../src/services/config'
import * as vdc from '../../src/services/vdc'
import fs = require('fs')
import mock = require('mock-fs')
import nock = require('nock')

describe('config tests', () => {
  it('should create the config correctly', async () => {

    nock(vdc.host)
      .get(vdc.getSwaggerPath())
      .reply(200, '{"foo":"bar"}', {'Content-Type': 'application/json'})

    mock()
    await config.init()
    expect(fs.existsSync(config.dir)).to.eq(true)
    expect(fs.existsSync(config.getVersionPath())).to.eq(true)
    expect(fs.existsSync(config.getPatchesPath())).to.eq(true)
    expect(fs.existsSync(config.getBaselinePath())).to.eq(true)

    const expected = `{
  "foo": "bar"
}`
    expect(fs.readFileSync(config.getBaselinePath()).toString()).to.equal(expected)
    mock.restore()
  })

  it('should count patches correctly', () => {
    const version = 5
    mock(
      {
        [config.getPatchPath(version, 1)]: 'foo',
        [config.getPatchPath(version, 2)]: 'bar',
        [config.getPatchPath(version, 3)]: 'foo',
        [config.getPatchPath(version, 4)]: 'bar',
        [config.getPatchPath(version, 5)]: 'foo',
        [config.getPatchPath(version, 6)]: 'bar',
        [config.getPatchPath(version, 7)]: 'foo',
        [config.getPatchPath(version, 8)]: 'bar',
        [config.getPatchPath(version, 9)]: 'bar',
        [config.getPatchPath(version, 10)]: 'foo',
        [config.getPatchPath(version, 11)]: 'bar',
        [config.getPatchPath(version, 12)]: 'foo',
        [`${config.getPatchesPath(version)}/foo.txt`]: 'bar'
      }
    )
    expect(config.countPatches(version)).to.equal(12)
    mock.restore()
  })

  it('should return 0 when there are no patches', () => {
    const version = 5
    mock(
      {
        [`${config.getPatchesPath(version)}/foo.txt`]: 'bar'
      }
    )
    expect(config.countPatches(version)).to.equal(0)
    mock.restore()
  })


  it('should throw when patches are out of order', () => {
    const version = 5
    mock(
      {
        [config.getPatchPath(version, 1)]: 'foo',
        [config.getPatchPath(version, 2)]: 'bar',
        [config.getPatchPath(version, 3)]: 'foo',
        [config.getPatchPath(version, 4)]: 'bar',
        [config.getPatchPath(version, 5)]: 'foo',
        [config.getPatchPath(version, 8)]: 'bar',
        [config.getPatchPath(version, 9)]: 'bar',
        [config.getPatchPath(version, 10)]: 'foo',
        [config.getPatchPath(version, 11)]: 'bar',
        [config.getPatchPath(version, 12)]: 'foo',
        [`${config.getPatchesPath(version)}/foo.txt`]: 'bar'
      }
    )
    expect(() => config.countPatches(version)).to.throw()
    mock.restore()
  })
})
