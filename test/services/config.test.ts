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
})
