import { expect } from 'chai'
import mock = require('mock-fs')
import * as json from '../../src/services/json'

describe('json tests', () => {
  it('should normalize files', async () => {
    mock(
      {
        'file.json': '{"foo": "bar"}'
      }
    )
    const expected = `{
  "foo": "bar"
}`
    expect(await json.normalize('file.json')).to.be.equal(expected)
    mock.restore()
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
    expect(await json.computePatch('file1.json', 'file2.json')).to.be.eq(expected)
    mock.restore()
  })
})
