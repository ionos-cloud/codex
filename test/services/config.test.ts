import { expect } from 'chai'
import configService, { Config } from '../../src/services/config'

import mock = require('mock-fs')
import fs = require('fs')

describe('config tests', () => {
  it('should createthe config correctly', () => {
    mock()
    configService.init()
    expect(fs.existsSync(Config.dir)).to.eq(true)
    expect(fs.existsSync(`${Config.dir}/${Config.defaultVersion}`)).to.eq(true)
    expect(fs.existsSync(`${Config.dir}/${Config.defaultVersion}/${Config.patchesDir}`)).to.eq(true)
    expect(fs.existsSync(`${Config.dir}/${Config.defaultVersion}/${Config.baselineFileName}`)).to.eq(true)
    mock.restore()
  })
})
