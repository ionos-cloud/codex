import chai, { expect } from 'chai'
import { VersionData, Mode, Status } from '../../src/services/version-data'
import vdc from '../../src/services/vdc'
import fs = require('fs')
import mock = require('mock-fs')
import nock = require('nock')
import chaiAsPromised from 'chai-as-promised'

describe('version data tests', () => {

  const mockBaseline = {info: {version: 'v5.0'}}
  const mockBaselineSDK1 = {info: {version: 'v5.0-SDK.1'}}
  const mockVersionData = (baseline: Record<string, any>) => {
    const state = {mode: Mode.IDLE, status: Status.OK, data: {}}

    const version = 5
    const versionData = new VersionData(version)

    mock({
      [versionData.getBaselinePath()]: JSON.stringify(baseline),
      [versionData.getStatePath()]: JSON.stringify(state),
      [versionData.getPatchesPath()]: {},
      [versionData.getUpstreamPath()]: {}
    })

    versionData.load()

    return versionData
  }
  const mockVersionDataWith1Patch = (baseline: Record<string, any>) => {
    const state = {mode: Mode.IDLE, status: Status.OK, data: {}}

    const version = 5
    const versionData = new VersionData(version)

    mock({
      [versionData.getBaselinePath()]: JSON.stringify(baseline),
      [versionData.getStatePath()]: JSON.stringify(state),
      [versionData.getPatchPath(1)]: 'foo',
      [versionData.getUpstreamPath()]: {}
    })

    versionData.load()

    return versionData
  }

  const mockVdc = (version: number, content: Record<string, any>) =>
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(200, JSON.stringify(content), {'Content-Type': 'application/json'})

  it('should create the version data correctly', async () => {

    const content = {info: {version: 'v5.0-SDK.1'}}
    const version = 8

    const versionData = new VersionData(version)
    nock(vdc.host)
      .get(vdc.getSwaggerPath(version))
      .reply(200, JSON.stringify(content), {'Content-Type': 'application/json'})

    mock()
    await versionData.init()
    expect(fs.existsSync(VersionData.dir)).to.eq(true)
    expect(fs.existsSync(versionData.getVersionPath())).to.eq(true)
    expect(fs.existsSync(versionData.getPatchesPath())).to.eq(true)
    expect(fs.existsSync(versionData.getBaselinePath())).to.eq(true)
    expect(fs.existsSync(versionData.getStatePath())).to.eq(true)

    expect(versionData.getBaselineJSON()).to.deep.equal(content)
    mock.restore()
  })

  it('should count patches correctly', () => {
    const version = 5

    const versionData = new VersionData(version)
    mock(
      {
        [versionData.getPatchPath(1)]: 'foo',
        [versionData.getPatchPath(2)]: 'bar',
        [versionData.getPatchPath(3)]: 'foo',
        [versionData.getPatchPath(4)]: 'bar',
        [versionData.getPatchPath(5)]: 'foo',
        [versionData.getPatchPath(6)]: 'bar',
        [versionData.getPatchPath(7)]: 'foo',
        [versionData.getPatchPath(8)]: 'bar',
        [versionData.getPatchPath(9)]: 'bar',
        [versionData.getPatchPath(10)]: 'foo',
        [versionData.getPatchPath(11)]: 'bar',
        [versionData.getPatchPath(12)]: 'foo',
        [`${versionData.getPatchesPath()}/foo.txt`]: 'bar'
      }
    )
    expect(versionData.countPatches()).to.equal(12)
    mock.restore()
  })

  it('should return 0 when there are no patches', () => {
    const version = 5
    const versionData = new VersionData(version)
    mock(
      {
        [`${versionData.getPatchesPath()}/foo.txt`]: 'bar'
      }
    )
    expect(versionData.countPatches()).to.equal(0)
    mock.restore()
  })

  it('should throw when patches are out of order', () => {
    const version = 5
    const versionData = new VersionData(version)

    mock(
      {
        [versionData.getPatchPath(1)]: 'foo',
        [versionData.getPatchPath(2)]: 'bar',
        [versionData.getPatchPath(3)]: 'foo',
        [versionData.getPatchPath(4)]: 'bar',
        [versionData.getPatchPath(5)]: 'foo',
        [versionData.getPatchPath(8)]: 'bar',
        [versionData.getPatchPath(9)]: 'bar',
        [versionData.getPatchPath(10)]: 'foo',
        [versionData.getPatchPath(11)]: 'bar',
        [versionData.getPatchPath(12)]: 'foo',
        [`${versionData.getPatchesPath()}/foo.txt`]: 'bar'
      }
    )
    expect(() => versionData.countPatches()).to.throw()
    mock.restore()
  })

  it('should read the baseline correctly', () => {
    const versionData = mockVersionData(mockBaselineSDK1)
    expect(versionData.getBaseline()).to.equal(JSON.stringify(mockBaselineSDK1))
    mock.restore()
  })

  it('should read the baseline as a JSON', () => {
    const versionData = mockVersionData(mockBaselineSDK1)
    expect(versionData.getBaselineJSON()).to.deep.equal(mockBaselineSDK1)
    mock.restore()
  })

  it('should read the patch level', () => {
    const level = 3
    const baseline = {info: {version: `v5.0-SDK.${level}`}}

    const versionData = mockVersionData(baseline)
    expect(versionData.getVersionPatchLevel()).to.deep.equal(level)

    mock.restore()
  })

  it('should read a patch', () => {
    const patch1 = 'foo'
    const versionData = mockVersionData(mockBaselineSDK1)
    mock({
      [versionData.getPatchPath(1)]: patch1,
    })

    expect(versionData.readPatch(1)).to.equal(patch1)

    mock.restore()
  })

  it('should apply a patch', () => {
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

    const versionData = mockVersionData(mockBaselineSDK1)
    mock({
      [versionData.getPatchPath(1)]: patchBody,
    })

    expect(versionData.applyPatch(target, 1)).to.equal(expected)

    mock.restore()
  })

  it('should determine vdc updates', async () => {
    const upstream = {info: {version: 'v5.0-SDK.2'}}
    const state = {mode: Mode.IDLE, status: Status.OK, data: {}}

    const version = 5
    const versionData = new VersionData(version)

    mock({
      [versionData.getBaselinePath()]: JSON.stringify(mockBaselineSDK1),
      [versionData.getStatePath()]: JSON.stringify(state),
      [versionData.getPatchPath(1)]: 'foo',
      [versionData.getPatchPath(2)]: 'bar',
      [versionData.getUpstreamPath()]: {}
    })

    versionData.load()
    nock(vdc.host)
      .get(vdc.getSwaggerPath(versionData.version))
      .reply(200, JSON.stringify(upstream), {'Content-Type': 'application/json'})

    const update = await versionData.updateCheck()
    expect(update).to.not.be.undefined
    expect(update?.patch).to.be.not.empty
    expect(update?.content).to.equal(JSON.stringify(upstream, null, 2))

    mock.restore()
  })

  it('should throw when upstream has a greater patch level than the number of patches',  () => {
    const versionData = mockVersionData(mockBaseline)
    const upstream = {info: {version: 'v5.0-SDK.2'}}
    mockVdc(versionData.version, upstream)

    chai.use(chaiAsPromised)
    expect(versionData.updateCheck()).to.eventually.be.rejectedWith(Error)

    mock.restore()
  })

  it('should throw when baseline patch level is greater than the upstream patch level',  () => {
    const versionData = mockVersionData(mockBaselineSDK1)
    const upstream = {info: {version: 'v5.0'}}
    mockVdc(versionData.version, upstream)

    chai.use(chaiAsPromised)
    expect(versionData.updateCheck()).to.eventually.be.rejectedWith(Error)

    mock.restore()
  })

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

    const mockUpstreamUpdateFileName = 'upstream-update-123.patch'
    versionData.getNewUpstreamPatchFileName = function () {
      return `${this.getUpstreamPath()}/${mockUpstreamUpdateFileName}`
    }

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
      versionData.createNewUpstreamUpdate(update.patch)
      versionData.updateBaseline(update.content)
      expect(versionData.baseline).to.equal(update.content)
      expect(versionData.baselineJson).to.deep.equal(upstream)
      expect(fs.existsSync(versionData.getBaselinePath())).to.be.true
      expect(fs.existsSync(versionData.getNewUpstreamPatchFileName()), 'upstream update file not created').to.be.true
      expect(fs.readFileSync(versionData.getNewUpstreamPatchFileName()).toString()).to.equal(update?.patch)
    }
    mock.restore()
  })

  it('should set an idle state correctly', () => {
    const versionData = mockVersionData(mockBaselineSDK1)
    expect(versionData.setIdle().state).to.deep.equal(VersionData.idleState)
    mock.restore()
  })
})
