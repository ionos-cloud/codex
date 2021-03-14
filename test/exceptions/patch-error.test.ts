import { PatchError } from '../../src/exceptions/patch-error';
import { expect } from 'chai'

describe('patch-error tests', () => {
  it('should hold patch data', () => {
    const e = new PatchError('some error', 123, 'foo')
    expect(e.message).to.be.equal('some error')
    expect(e.patch).to.be.equal(123)
    expect(e.content).to.be.equal('foo')
  })
})
