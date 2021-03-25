import mocks from '../mocks'
import mock = require('mock-fs')

import config from '../../src/services/config'
import { expect } from 'chai'
import * as fs from 'fs'

import { test } from '@oclif/test'

describe('config tests', () => {

  const configPath = config.getConfigFileName(mocks.config.dir)

  beforeEach(() => {
    mock(mocks.config.defaultMock)
    config.load(mocks.config.dir)
  })

  afterEach(() => {
    mock.restore()
  })

  it('should read a variable correctly', () => {
    expect(config.get('s3.key')).to.equal(mocks.config.defaultConfigMock.s3.key)
  })

  it('should set a variable correctly', () => {
    const value = 'changed'
    const path = 's3.key'
    config.set(path, value)
    expect(config.get(path)).to.equal(value)
  })

  it('should save the config correctly', () => {
    const value = 'changed'
    const path = 's3.key'
    config.set(path, value).save()

    expect(fs.existsSync(configPath)).to.equal(true)

    const data = JSON.parse(fs.readFileSync(configPath).toString())

    expect(data.s3.key).to.be.equal(value)
  })

  it('should initialize the config correctly', () => {

    fs.unlinkSync(configPath)
    config.init()
    expect(fs.existsSync(configPath)).to.equal(true)

    const data = JSON.parse(fs.readFileSync(configPath).toString())

    expect(data.s3.key).to.be.equal(config.data.s3.key)
  })

  it('should not initialize if file already exists', () => {
    const orig = config.data.s3.key
    config.data.s3.key = `${orig} MODIFIED`
    config.init()
    expect(fs.existsSync(configPath)).to.equal(true)

    const data = JSON.parse(fs.readFileSync(configPath).toString())

    expect(data.s3.key).to.be.equal(orig)
  })

  it('should throw if config key is not found', () => {
    expect(() => {
      config.get('foo.bar')
    }).to.throw()
  })

  it('should throw when saving an unknown path', () => {
    expect(() => {
      config.set('foo.bar', 'baz')
    }).to.throw()
  })

  it('should set a new leaf correctly', () => {
    config.set('s3.foo', 'bar')
    expect(config.get('s3.foo')).to.equal('bar')
  })

  it('load should throw if config is invalid', () => {
    fs.writeFileSync(configPath, '{foo')
    expect(() => {
      config.load(mocks.config.dir)
    }).to.throw()
  })

  test.stdout().it('should warn if config file is not found', ctx => {
    fs.unlinkSync(configPath)
    config.load(mocks.config.dir)
    expect(ctx.stdout).to.contain('config file not found')
  })
});
