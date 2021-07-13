import chai, { expect } from 'chai'
import vdc from '../../src/services/api'
import nock = require('nock')
import chaiAsPromised = require('chai-as-promised')
import config from '../../src/services/config'

describe('vdc tests', () => {
  const mockVdc = (mock: {content: Record<string, any>; status: number; error: string | null}) => {
    const parts = config.data.apiSpecUrl.split('://')
    const proto = parts[0]
    const host = parts[1].substr(0, parts[1].indexOf('/'))
    const baseUrl = parts[1].substr(parts[1].indexOf('/') + 1)
    const m = nock(`${proto}://${host}`)
      .get(`/${baseUrl}`)

    if (mock.error !== null && mock.error !== undefined && mock.error !== '') {
      m.replyWithError(mock.error)
    } else  if (mock.status < 300 && mock.status > 199) {
      m.reply(mock.status, JSON.stringify(mock.content), {'Content-Type': 'application/json'})
    } else {
      m.reply(mock.status)
    }

  }

  it('should download v5', async () => {

    mockVdc({
      content: {foo: 'bar'},
      status: 200,
      error: null
    })
    const data = await vdc.fetchSwaggerFile()
    const expected = {
      foo: 'bar'
    }
    expect(data).to.deep.equal(expected)
  })

  it('should throw if swagger file is not found', async () => {
    mockVdc({content: {}, status: 404, error: null})
    chai.use(chaiAsPromised)
    expect(vdc.fetchSwaggerFile()).to.eventually.be.rejectedWith(Error)
  })

  it('should throw on HTTP connection error', async () => {
    mockVdc({content: {}, status: 500, error: 'they tripped on the server power cable'})
    chai.use(chaiAsPromised)
    expect(vdc.fetchSwaggerFile()).to.eventually.be.rejectedWith(Error)
  })
})
