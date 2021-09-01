import chai, { expect } from 'chai'
import mock = require('mock-fs')
import nock = require('nock')
import * as utils from '../../src/services/utils'
import chaiAsPromised = require('chai-as-promised')
import renderers from '../../src/renderers'

describe('json tests', () => {
  it('should normalizeFile files', async () => {
    mock(
      {
        'file.json': '{"foo": "bar"}'
      }
    )
    const expected = `{
    "foo": "bar"
}`
    expect(await utils.normalizeFile('file.json', renderers.json)).to.be.equal(expected)
    mock.restore()
  })

  it('should normalizeFile via http', async () => {
    nock('http://foo.bar')
      .get('/test.json')
      .reply(200, '{"foo":"bar"}', {'Content-Type': 'application/json'})
    const expected = `{
    "foo": "bar"
}`
    expect(await utils.normalizeFile('http://foo.bar/test.json', renderers.json)).to.be.equal(expected)
  })

  it('should throw on 404', async () => {
    nock('http://foo.bar')
      .get('/test.json')
      .reply(404)

    chai.use(chaiAsPromised)
    await expect(utils.normalizeFile('http://foo.bar/test.json', renderers.json)).to.be.rejectedWith(Error)
  })

  it('should throw on HTTP connection error', async () => {
    nock('http://foo.bar')
      .get('/test.json')
      .replyWithError('they tripped on the server power cable')

    chai.use(chaiAsPromised)
    await expect(utils.normalizeFile('http://foo.bar/test.json', renderers.json)).to.be.rejectedWith(Error)

  })

  it('should throw on JSON errors', async () => {
    mock({
      'broken.json': '{foo'
    })

    chai.use(chaiAsPromised)
    await expect(utils.normalizeFile('broken.json', renderers.json)).to.be.rejectedWith(Error)
  })

  it('should compute a diff', async () => {
    mock(
      {
        'file1.json': `{
  "foo": "bar"
}`,
        'file2.json': '{"foo":"bar"}'
      }
    )
    const expected  = `===================================================================
--- file1.json
+++ file2.json
`
    expect(await utils.computePatch('file1.json', 'file2.json', renderers.json)).to.be.eq(expected)
    mock.restore()
  })
})
