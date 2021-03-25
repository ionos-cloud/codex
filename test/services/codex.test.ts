import chai, { expect } from 'chai'
import { Codex } from '../../src/services/codex'
import { idleState } from '../../src/services/state'
import config from '../../src/services/config'

import mocks from '../mocks'

import vdc from '../../src/services/vdc'
import fs = require('fs')
import mock = require('mock-fs')
import nock = require('nock')
import chaiAsPromised from 'chai-as-promised'

describe('codex tests', async () => {

  const storageMock = new mocks.Storage({})

  const mockBaseline = {info: {version: 'v5.0'}}
  const mockBaselineSDK1 = {info: {version: 'v5.0-SDK.1'}}

  const mockCodex = async (baseline: Record<string, any>, version = 5, patches = {}) => {

    mock({
      ...mocks.state.mockFs(idleState),
      ...mocks.config.defaultMock
    })

    config.load(mocks.config.dir)
    const codex = new Codex(version, storageMock)

    storageMock.addMock({
      [`v${version}`]: {
        'baseline.json': JSON.stringify(baseline, null, 2),
        patches
      }
    })
    codex.storage = storageMock

    await codex.load()

    return codex
  }

  const mockCodexWith1Patch = (baseline: Record<string, any>, version = 5) => mockCodex(baseline, version, {
    '1.patch': 'foo',
    '1.txt': 'bar'
  })

  const mockVdc = (version: number, content: Record<string, any>) =>
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(200, JSON.stringify(content), {'Content-Type': 'application/json'})

  it('should create the version data correctly', async () => {

    const content = {info: {version: 'v5.0-SDK.1'}}
    const version = 8

    const codex = await mockCodex(mockBaseline, version)
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(200, JSON.stringify(content), {'Content-Type': 'application/json'})

    mock()
    await codex.init()
    expect(storageMock.isDir(storageMock.getVersionPath(version))).to.eq(true)
    expect(storageMock.isDir(storageMock.getPatchesPath(version))).to.eq(true)
    expect(storageMock.exists(storageMock.getBaselinePath(version))).to.eq(true)
    expect(codex.getBaselineJSON()).to.deep.equal(content)
    mock.restore()
  })

  it('should count patches correctly', async () => {
    const version = 5

    const codex = await mockCodex(mockBaseline, version, {
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
  })

  it('should return 0 when there are no patches', async () => {
    const version = 5
    const codex = await mockCodex(mockBaseline, version, {'foo.txt': 'bar'})
    expect(codex.getMaxPatchLevel()).to.equal(0)
    mock.restore()
  })

  it('should read the baseline correctly', async () => {
    const codex = await mockCodex(mockBaselineSDK1)
    expect(codex.getBaseline()).to.equal(JSON.stringify(mockBaselineSDK1, null, 2))
    mock.restore()
  })

  it('should read the baseline as a JSON', async () => {
    const codex = await mockCodex(mockBaselineSDK1)
    expect(codex.getBaselineJSON()).to.deep.equal(mockBaselineSDK1)
    mock.restore()
  })

  it('should read the patch level', async () => {
    const level = 3
    const baseline = {info: {version: `v5.0-SDK.${level}`}}

    const codex = await mockCodex(baseline)
    expect(codex.getVersionPatchLevel()).to.deep.equal(level)

    mock.restore()
  })

  it('should read a patch', async () => {
    const version = 5
    const patch1 = 'foo'
    const codex = await mockCodex(mockBaselineSDK1, version, {'1.patch': patch1})

    expect(await codex.getPatch(1)).to.equal(patch1)

    mock.restore()
  })

  it('should apply a patch', async () => {
    const version = 5
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

    const codex = await mockCodex(mockBaselineSDK1, version, {
      '1.patch': patchBody
    })

    expect(await codex.applyPatch(target, 1)).to.equal(expected)

    mock.restore()
  })

  it('should determine vdc updates', async () => {
    const upstream = {info: {version: 'v5.0-SDK.2'}}
    const version = 5
    const codex = await mockCodex(mockBaselineSDK1, version, {
      '1.patch': 'foo',
      '1.txt': 'foo desc',
      '2.patch': 'bar',
      '2.txt': 'bar desc'
    })

    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(200, JSON.stringify(upstream), {'Content-Type': 'application/json'})

    const update = await codex.updateCheck()
    expect(update).to.not.be.undefined
    expect(update?.patch).to.be.not.empty
    expect(update?.content).to.equal(JSON.stringify(upstream, null, 2))

    mock.restore()
  })

  it('should throw when upstream has a greater patch level than the number of patches',  async () => {
    const codex = await mockCodex(mockBaseline)
    const upstream = {info: {version: 'v5.0-SDK.2'}}
    mockVdc(codex.version, upstream)

    chai.use(chaiAsPromised)
    expect(codex.updateCheck()).to.eventually.be.rejectedWith(Error)

    mock.restore()
  })

  it('should throw when baseline patch level is greater than the upstream patch level',  async () => {
    const codex = await mockCodex(mockBaselineSDK1)
    const upstream = {info: {version: 'v5.0'}}
    mockVdc(codex.version, upstream)

    chai.use(chaiAsPromised)
    expect(codex.updateCheck()).to.eventually.be.rejectedWith(Error)

    mock.restore()
  })

  it('should compute an upstream update correctly', async () => {
    const version = 5
    const codex = await mockCodexWith1Patch({
      swagger: '2.0',
      info: {
        description: 'Some description',
        version: '5.0',
        title: 'CLOUD API'
      }
    }, version)
    const upstream = {
      swagger: '2.0',
      info: {
        description: 'Some description',
        version: '5.0-SDK.1',
        title: 'CLOUD API changed'
      }
    }
    mockVdc(codex.version, upstream)

    const update = await codex.updateCheck()
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
      const upstreamPatchFileName = 'upstream.patch'
      codex.createNewUpstreamUpdate(update.patch, upstreamPatchFileName)
      await codex.updateBaseline(update.content)
      expect(codex.baseline).to.equal(update.content)
      expect(codex.baselineJson).to.deep.equal(upstream)
      expect(storageMock.exists(storageMock.getBaselinePath(version))).to.be.true
      expect(fs.existsSync(upstreamPatchFileName), 'upstream update file not created').to.be.true
      expect(fs.readFileSync(upstreamPatchFileName).toString()).to.equal(update?.patch)
    }
    mock.restore()
  })
})
