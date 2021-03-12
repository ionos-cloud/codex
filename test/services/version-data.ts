import { expect } from 'chai'
import { VersionData, Mode, Status } from '../../src/services/version-data'
import * as vdc from '../../src/services/vdc'
import fs = require('fs')
import mock = require('mock-fs')
import nock = require('nock')

describe('version data tests', () => {

  const mockBaseline = {info: {version: 'v5.0-SDK.1'}}
  const mockVersionData = (baseline: Record<string, any>) => {
    const state = {mode: Mode.IDLE, status: Status.OK, data: {}}

    const version = 5
    const versionData = new VersionData(version)

    mock({
      [versionData.getBaselinePath()]: JSON.stringify(baseline),
      [versionData.getStatePath()]: JSON.stringify(state),
      [versionData.getPatchesPath()]: {}
    })

    versionData.load()

    return versionData
  }

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
    const versionData = mockVersionData(mockBaseline)
    expect(versionData.getBaseline()).to.equal(JSON.stringify(mockBaseline))
    mock.restore()
  })

  it('should read the baseline as a JSON', () => {
    const versionData = mockVersionData(mockBaseline)
    expect(versionData.getBaselineJSON()).to.deep.equal(mockBaseline)
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
    const versionData = mockVersionData(mockBaseline)
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

    const versionData = mockVersionData(mockBaseline)
    mock({
      [versionData.getPatchPath(1)]: patchBody,
    })

    expect(versionData.applyPatch(target, 1)).to.equal(expected)

    mock.restore()
  })
})
