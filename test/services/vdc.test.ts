import chai, { expect } from 'chai'
import vdc from '../../src/services/vdc'
import nock = require('nock')
import chaiAsPromised = require('chai-as-promised')

describe('vdc tests', () => {
  it('should download v5', async () => {
    nock(vdc.host)
      .get(vdc.getSwaggerPath(5))
      .reply(200, '{"foo":"bar"}', {'Content-Type': 'application/json'})
    const data = await vdc.fetchSwaggerFile(5)
    const expected = {
      foo: 'bar'
    }
    expect(data).to.deep.equal(expected)
  })

  it('should throw if swagger file is not found', async () => {
    const version = 5
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(404)
    chai.use(chaiAsPromised)
    expect(vdc.fetchSwaggerFile(version)).to.eventually.be.rejectedWith(Error)
  })

  it('should throw on HTTP connection error', async () => {
    const version = 5
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .replyWithError('they tripped on the server power cable')

    chai.use(chaiAsPromised)
    expect(vdc.fetchSwaggerFile(version)).to.eventually.be.rejectedWith(Error)
  })
})
