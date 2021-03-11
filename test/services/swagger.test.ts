import { expect } from 'chai'
import * as swagger from '../../src/services/swagger'

describe('swagger tests', function () {
  it('should get the patch level', () => {
    const level = 4
    const content = {info: {version: `v5.0-SDK.${level}`}}
    expect(swagger.getPatchLevel(content)).to.equal(level)
  })

  it('should get a 0 patch level when there\'s none', () => {
    const content = {info: {version: 'v5.0'}}
    expect(swagger.getPatchLevel(content)).to.equal(0)
  })

  it('should throw when there\'s no version info', () => {
    const content = {info: 'foo'}
    expect(() => swagger.getPatchLevel(content)).to.throw()
  })

  it('should return 0 when there\'s an invalid patch level', () => {
    const content = {info: {version: 'v5.0-SDK.foo'}}
    expect(swagger.getPatchLevel(content)).to.equal(0)
  })
});
