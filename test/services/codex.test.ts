import chai, { expect } from 'chai'
import { Codex, Mode, Status } from '../../src/services/codex'
import vdc from '../../src/services/vdc'
import fs = require('fs')
import mock = require('mock-fs')
import nock = require('nock')
import chaiAsPromised from 'chai-as-promised'
import { file } from 'mock-fs'

describe('version data tests', () => {

  const mockBaseline = {info: {version: 'v5.0'}}
  const mockBaselineSDK1 = {info: {version: 'v5.0-SDK.1'}}

  const mockVdc = (version: number, content: Record<string, any>) =>
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(200, JSON.stringify(content), {'Content-Type': 'application/json'})

  it('should compute an upstream update correctly', async () => {
    const versionData = mockVersionDataWith1Patch({
      swagger: '2.0',
      info: {
        description: 'Some description',
        version: '5.0',
        title: 'CLOUD API'
      }
    })
    const upstream = {
      swagger: '2.0',
      info: {
        description: 'Some description',
        version: '5.0-SDK.1',
        title: 'CLOUD API changed'
      }
    }
    mockVdc(versionData.version, upstream)

    const update = await versionData.updateCheck()
    expect(update).to.not.be.undefined
    expect(update?.patch).to.equal(`Index: swagger.json
===================================================================
--- swagger.json
+++ swagger.json
@@ -1,8 +1,8 @@
 {
   "swagger": "2.0",
   "info": {
     "description": "Some description",
-    "version": "5.0",
-    "title": "CLOUD API"
+    "version": "5.0-SDK.1",
+    "title": "CLOUD API changed"
   }
 }
\\ No newline at end of file
`
    )
    expect(update?.content).to.equal(JSON.stringify(upstream, null, 2))

    if (update !== undefined) {
      const fileName = 'upstream-update.patch'
      versionData.createNewUpstreamUpdate(update.patch, fileName)
      await versionData.updateBaseline(update.content)
      expect(versionData.baseline).to.equal(update.content)
      expect(versionData.baselineJson).to.deep.equal(upstream)
      expect(fs.readFileSync(fileName).toString()).to.equal(update?.patch)
    }
    mock.restore()
  })

})
