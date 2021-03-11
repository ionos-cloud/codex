import { expect } from 'chai'
import vdc from '../../src/services/vdc'

describe('vdc tests', () => {
  it('should download v5', async () => {
    const data = await vdc.fetch()
    expect(data.swagger.length).to.be.greaterThan(0)
  })
})
