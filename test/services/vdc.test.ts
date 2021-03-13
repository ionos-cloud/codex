import { expect } from 'chai'
import vdc from '../../src/services/vdc'
import nock = require('nock')

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
})
