import * as config from './config'
import * as fs from 'fs'
import * as diff from 'diff'

/**
 * read a patch file with the given number
 *
 * @param {number} version - version to work on
 * @param {number} patchNumber - patch number to fetch
 *
 * @returns {string} patch contents
 */
export function readPatch(version: number, patchNumber: number): string {
  return fs.readFileSync(config.getPatchPath(version, patchNumber)).toString()
}

/**
 * apply the given patch
 *
 * @param {string} target - content to apply the patch on
 * @param {number} version - swagger version
 * @param {number} patchNumber - patch number
 *
 * @returns {string} content with patch applied
 */
export function applyPatch(target: string, version: number, patchNumber: number): string {
  const patch = readPatch(version, patchNumber)
  const result = diff.applyPatch(target, patch)
  return result
}
