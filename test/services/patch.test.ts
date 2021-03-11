import { expect } from 'chai'
import mock = require('mock-fs')
import * as patch from '../../src/services/patch'
import * as config from '../../src/services/config'

describe('patch tests', function () {
  it('should read a patch', () => {
    const patch1 = 'foo'
    const patch2 = 'bar'

    mock({
      [config.getPatchPath(5, 1)]: patch1,
      [config.getPatchPath(6, 1)]: patch2
    })

    expect(patch.readPatch(5, 1)).to.equal(patch1)
    expect(patch.readPatch(6, 1)).to.equal(patch2)
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

    mock({
      [config.getPatchPath(5, 1)]: patchBody,
    })

    expect(patch.applyPatch(target, 5, 1)).to.equal(expected)
  })
});
