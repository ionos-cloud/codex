import { expect } from 'chai'
import * as vdc from '../../src/services/vdc'
import nock = require('nock')

describe('vdc tests', () => {
  it('should download v5', async () => {
    nock(vdc.host)
      .get(vdc.getSwaggerPath())
      .reply(200, '{"foo":"bar"}', {'Content-Type': 'application/json'})
    const data = await vdc.fetchSwaggerFile()
    const expected = {
      foo: 'bar'
    }
    expect(data).to.deep.equal(expected)
  })
})
