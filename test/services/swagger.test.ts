import { expect } from 'chai'
import * as swagger from '../../src/services/swagger'
import mock = require('mock-fs')
import * as fs from 'fs'

describe('swagger tests', function () {
  it('should get the patch level', () => {
    const level = 4
    const content = {info: {version: `v5.0-SDK.${level}`}}
    expect(swagger.getVersionPatchLevel(content)).to.equal(level)
  })

  it('should get a 0 patch level when there\'s none', () => {
    const content = {info: {version: 'v5.0'}}
    expect(swagger.getVersionPatchLevel(content)).to.equal(0)
  })

  it('should throw when there\'s no version info', () => {
    const content = {info: 'foo'}
    expect(() => swagger.getVersionPatchLevel(content)).to.throw()
  })

  it('should return 0 when there\'s an invalid patch level', () => {
    const content = {info: {version: 'v5.0-SDK.foo'}}
    expect(swagger.getVersionPatchLevel(content)).to.equal(0)
  })

  it('should correctly set the patch level', () => {
    const json = {
      info: {
        version: '5.0'
      }
    }
    swagger.setPatchLevel(json, 3)
    expect(json.info.version).to.be.equal('5.0-SDK.3')
  })

  it('should correctly change the patch level', () => {
    const json = {
      info: {
        version: '5.0-SDK.1'
      }
    }
    swagger.setPatchLevel(json, 2)
    expect(json.info.version).to.be.equal('5.0-SDK.2')
  })

  it('should correctly fix the patch level in a file', () => {
    const json = {
      info: {
        version: '5.0'
      }
    }
    const fileName = 'test.json'
    const patchLevel1 = 1
    const patchLevel2 = 2

    mock({
      [fileName]: JSON.stringify(json, null, 2)
    })

    swagger.fixPatchLevel(fileName, patchLevel1)

    let result = JSON.parse(fs.readFileSync(fileName).toString())

    expect(result.info.version).to.be.equal(`5.0-SDK.${patchLevel1}`)
    expect(swagger.getVersionPatchLevel(result)).to.equal(patchLevel1)

    swagger.fixPatchLevel(fileName, patchLevel2)

    result = JSON.parse(fs.readFileSync(fileName).toString())

    expect(result.info.version).to.be.equal(`5.0-SDK.${patchLevel2}`)
    expect(swagger.getVersionPatchLevel(result)).to.equal(patchLevel2)

    /* not is should leave it as it is */
    swagger.fixPatchLevel(fileName, patchLevel2)

    result = JSON.parse(fs.readFileSync(fileName).toString())

    expect(result.info.version).to.be.equal(`5.0-SDK.${patchLevel2}`)
    expect(swagger.getVersionPatchLevel(result)).to.equal(patchLevel2)

    mock.restore()
  })

  it('should fill in missing info', () => {
    const dummy: Record<string, any> = {}
    swagger.setPatchLevel(dummy, 3)
    expect(dummy.info).to.have.property('version')
    expect(dummy.info.version).to.be.equal('-SDK.3')
  })
})
