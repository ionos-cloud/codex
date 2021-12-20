import chai, {expect} from 'chai'
import {Codex} from '../../src/services/codex'
import {idleState} from '../../src/services/state'
import config from '../../src/services/config'
import renderers from '../../src/renderers'
import * as swagger from '../../src/services/swagger'

import mocks from '../mocks'

import fs = require('fs')
import mock = require('mock-fs')
import nock = require('nock')
import chaiAsPromised from 'chai-as-promised'

describe('codex tests', async () => {

  const storageMock = new mocks.Storage({})

  const mockBaseline = {info: {version: 'v5.0'}}
  const mockBaselineSDK1 = {info: {version: 'v5.0', [swagger.sdkPatchLevelAttr]: 1}}

  const mockCodex = async (baseline: Record<string, any>, patches = {}) => {

    mock({
      ...mocks.state.mockFs(idleState),
      ...mocks.config.defaultMock
    })

    config.load(mocks.config.dir)
    const codex = new Codex(storageMock)

    storageMock.addMock({
      [storageMock.getApiConfigPath()]: JSON.stringify(mocks.mockApiConfig, null, 2),
      [storageMock.getBaselinePath()]: JSON.stringify(baseline, null, 2),
      patches
    })
    codex.storage = storageMock

    await codex.load()

    return codex
  }

  const mockCodexWith1Patch = (baseline: Record<string, any>) => mockCodex(baseline, {
    '1.patch': 'foo',
    '1.txt': 'bar'
  })
  const mockCodexWith2Patches = (baseline: Record<string, any>) => mockCodex(baseline, {
    '1.patch': 'foo',
    '1.txt': 'bar',
    '2.patch': 'bar',
    '2.txt': 'bar desc'
  })

  const mockVdc = (content: Record<string, any>) => {
    const parts = mocks.mockApiConfig.specUrl.split('://')
    const proto = parts[0]
    const host = parts[1].substr(0, parts[1].indexOf('/'))
    const baseUrl = parts[1].substr(parts[1].indexOf('/') + 1)
    nock(`${proto}://${host}`)
      .persist()
      .get(`/${baseUrl}`)
      .reply(200, JSON.stringify(content), {'Content-Type': 'application/json'})
  }

  it('should create the version data correctly', async () => {

    const content = {info: {version: 'v5.0', [swagger.sdkPatchLevelAttr]: 1}}

    const codex = await mockCodex(mockBaseline)
    mockVdc(content)

    mock()
    await codex.init({specUrl: mocks.mockApiConfig.specUrl, format: 'json'})
    expect(storageMock.isDir(storageMock.getPatchesPath()), 'patches path exists').to.eq(true)
    expect(storageMock.exists(storageMock.getBaselinePath()), 'baseline exists').to.eq(true)
    expect(codex.getBaseline(), 'baseline content').to.deep.equal(content)
    mock.restore()
    nock.cleanAll()
  })

  it('should count patches correctly', async () => {

    const codex = await mockCodex(mockBaseline, {
      '1.patch': 'foo',
      '2.patch': 'bar',
      '3.patch': 'foo',
      '4.patch': 'bar',
      '5.patch': 'foo',
      '6.patch': 'bar',
      '7.patch': 'foo',
      '8.patch': 'bar',
      '9.patch': 'bar',
      '10.patch': 'foo',
      '11.patch': 'bar',
      '12.patch': 'foo',
      'foo.txt': 'bar'
    })

    expect(codex.getMaxPatchLevel()).to.equal(12)
    mock.restore()
    nock.cleanAll()
  })

  it('should return 0 when there are no patches', async () => {
    const codex = await mockCodex(mockBaseline, {'foo.txt': 'bar'})
    expect(codex.getMaxPatchLevel()).to.equal(0)
    mock.restore()
    nock.cleanAll()
  })

  it('should read the baseline correctly', async () => {
    const codex = await mockCodex(mockBaselineSDK1)
    expect(codex.getBaselineString()).to.equal(JSON.stringify(mockBaselineSDK1, null, 2))
    mock.restore()
    nock.cleanAll()
  })

  it('should read the baseline as a JSON', async () => {
    const codex = await mockCodex(mockBaselineSDK1)
    expect(codex.getBaseline()).to.deep.equal(mockBaselineSDK1)
    mock.restore()
    nock.cleanAll()
  })

  it('should read the patch level', async () => {
    const level = 3
    const baseline = {info: {version: 'v5.0', [swagger.sdkPatchLevelAttr]: level}}

    const codex = await mockCodex(baseline)
    expect(codex.getVersionPatchLevel()).to.deep.equal(level)

    mock.restore()
    nock.cleanAll()
  })

  it('should read a patch', async () => {
    const patch1 = 'foo'
    const codex = await mockCodex(mockBaselineSDK1, {'1.patch': patch1})

    expect(await codex.getPatch(1)).to.equal(patch1)

    mock.restore()
    nock.cleanAll()
  })

  it('should apply a patch', async () => {
    const patchBody = `--- t1.json\t2021-03-11 17:47:51.000000000 +0200
+++ t2.json\t2021-03-11 17:48:01.000000000 +0200
@@ -1,3 +1,3 @@
 {
-  "foo": "bar"
+  "foo": "baz"
 }`
    const target = `{
  "foo": "bar"
}`
    const expected = `{
  "foo": "baz"
}`

    const codex = await mockCodex(mockBaselineSDK1, {
      '1.patch': patchBody
    })

    expect(await codex.applyPatch(target, 1)).to.equal(expected)

    mock.restore()
    nock.cleanAll()
  })

  it('should determine vdc updates', async () => {
    const upstream = {info: {version: 'v5.0', [swagger.sdkPatchLevelAttr]: 2}}
    const codex = await mockCodex(mockBaselineSDK1, {
      '1.patch': 'foo',
      '1.txt': 'foo desc',
      '2.patch': 'bar',
      '2.txt': 'bar desc'
    })

    mockVdc(upstream)

    const update = await codex.updateCheck()
    expect(update).to.not.be.undefined
    expect(update?.patch).to.be.not.empty
    expect(update?.content).to.equal(renderers.json.marshal(upstream))

    mock.restore()
    nock.cleanAll()
  })

  it('should apply patch when upstream has the patch already deployed and baseline not yet updated', async () => {
    // having 2 patches in codex, baseline has only 1
    // 2 patches are deployed in upstream, but the baseline from codex was not updated
    const codex = await mockCodex(mockBaselineSDK1, {
      '1.patch': 'foo',
      '1.txt': 'foo desc',
      '2.patch': 'bar',
      '2.txt': 'bar desc'
    })
    // the upstream has 2 patches deployed
    const upstream = {info: {version: 'v5.0', [swagger.sdkPatchLevelAttr]: 2}}
    mockVdc(upstream)

    const compile = await codex.compile(2)
    // x-sdk-patch-level should be 1, as the 2 was not updated from upstream
    expect(compile).to.be.equal(`{
  "info": {
    "version": "v5.0",
    "${swagger.sdkPatchLevelAttr}": 1
  }
}`)
    expect(codex.getMaxPatchLevel()).to.equal(2)

    mock.restore()
    nock.cleanAll()
  })

  it('should throw when upstream has a greater patch level than the number of patches', async () => {
    const codex = await mockCodex(mockBaseline)
    const upstream = {info: {version: 'v5.0', [swagger.sdkPatchLevelAttr]: 2}}
    mockVdc(upstream)

    chai.use(chaiAsPromised)
    expect(codex.updateCheck()).to.eventually.be.rejectedWith(Error)

    mock.restore()
    nock.cleanAll()
  })

  it('should throw when baseline patch level is greater than the upstream patch level', async () => {
    const codex = await mockCodex(mockBaselineSDK1)
    const upstream = {info: {version: 'v5.0'}}
    mockVdc(upstream)

    chai.use(chaiAsPromised)
    expect(codex.updateCheck()).to.eventually.be.rejectedWith(Error)

    mock.restore()
    nock.cleanAll()
  })

  it('should compute an upstream update correctly', async () => {
    const codex = await mockCodexWith1Patch({
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
        version: '5.0',
        [swagger.sdkPatchLevelAttr]: 1,
        title: 'CLOUD API changed'
      }
    }
    mockVdc(upstream)

    const update = await codex.updateCheck()
    expect(update).to.not.be.undefined
    expect(update?.patch).to.equal(`Index: swagger.json
===================================================================
--- swagger.json
+++ swagger.json
@@ -2,7 +2,8 @@
   "swagger": "2.0",
   "info": {
     "description": "Some description",
     "version": "5.0",
-    "title": "CLOUD API"
+    "${swagger.sdkPatchLevelAttr}": 1,
+    "title": "CLOUD API changed"
   }
 }
\\ No newline at end of file
`
    )
    expect(update?.content).to.equal(renderers.json.marshal(upstream))

    if (update !== undefined) {
      const upstreamPatchFileName = 'upstream.patch'
      codex.createNewUpstreamUpdate(update.patch, upstreamPatchFileName)
      await codex.updateBaseline(update.content)
      expect(codex.baselineStr).to.equal(update.content)
      expect(codex.baseline).to.deep.equal(upstream)
      expect(storageMock.exists(storageMock.getBaselinePath())).to.be.true
      expect(fs.existsSync(upstreamPatchFileName), 'upstream update file not created').to.be.true
      expect(fs.readFileSync(upstreamPatchFileName).toString()).to.equal(update?.patch)
    }
    mock.restore()
    nock.cleanAll()
  })

  it('should compute an upstream update correctly even if the last patch is deployed in production', async () => {
    const codex = await mockCodexWith2Patches({
      swagger: '2.0',
      info: {
        description: 'Some description',
        version: '5.0',
        [swagger.sdkPatchLevelAttr]: 1,
        title: 'CLOUD API'
      }
    })
    const upstream = {
      swagger: '2.0',
      info: {
        description: 'Some description',
        version: '5.0',
        [swagger.sdkPatchLevelAttr]: 2,
        title: 'CLOUD API changed'
      }
    }
    mockVdc(upstream)

    const update = await codex.updateCheck()
    expect(update).to.not.be.undefined
    expect(update?.patch).to.equal(`Index: swagger.json
===================================================================
--- swagger.json
+++ swagger.json
@@ -2,8 +2,8 @@
   "swagger": "2.0",
   "info": {
     "description": "Some description",
     "version": "5.0",
-    "${swagger.sdkPatchLevelAttr}": 1,
-    "title": "CLOUD API"
+    "${swagger.sdkPatchLevelAttr}": 2,
+    "title": "CLOUD API changed"
   }
 }
\\ No newline at end of file
`
    )
    expect(update?.content).to.equal(renderers.json.marshal(upstream))
    if (update !== undefined) {
      const upstreamPatchFileName = 'upstream.patch'
      codex.createNewUpstreamUpdate(update.patch, upstreamPatchFileName)
      await codex.updateBaseline(update.content)
      expect(codex.baselineStr).to.equal(update.content)
      expect(codex.baseline).to.deep.equal(upstream)
      expect(storageMock.exists(storageMock.getBaselinePath())).to.be.true
      expect(fs.existsSync(upstreamPatchFileName), 'upstream update file not created').to.be.true
      expect(fs.readFileSync(upstreamPatchFileName).toString()).to.equal(update?.patch)
    }
    mock.restore()
    nock.cleanAll()
  })
})
