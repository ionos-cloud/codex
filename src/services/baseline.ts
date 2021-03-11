import * as config from './config'
import * as fs from 'fs'

export const sdkVersionSuffixPattern = /-SDK\.([0-9]+)/

/**
 * read the baseline file contents
 * @param {number} version - swagger version
 *
 * @returns {string} file contents
 */
export function read(version: number): string {
  return fs.readFileSync(config.getBaselinePath(version)).toString()
}

/**
 * read the baseline file as into a JSON object
 * @param {number} version - swagger version
 *
 * @returns {Record<string, any>} JSON object
 */
export function readJSON(version: number): Record<string, any> {
  return JSON.parse(read(version))
}

/**
 * get patch level from baseline
 * @param {number} version - swagger version
 *
 * @returns {number} patch level
 */
export function getPatchLevel(version: number): number {
  const swagger = readJSON(version)
  if (swagger.info === undefined || swagger.info.version === undefined) {
    throw new Error('invalid baseline swagger file; version information not found')
  }

  const match = swagger.info.version.match(sdkVersionSuffixPattern)
  if (match === null || match.length < 2) {
    return 0
  }

  const level = Number(match[1])
  if (isNaN(level)) {
    throw new TypeError(`invalid sdk patch level found in baseline: ${match[1]}`)
  }

  return level
}

/**
 * compile a swagger file from the baseline and the patches up to the specified patch level
 * @param {number} version - version to work on
 * @param {number} level - the patch level up to which patches will be applied (including)
 * @param {string} fileName - file name to save the result in
 */
export function compile(version = config.defaultVersion, level = 0, fileName = 'swagger.json') {

  /* apply patches in sequence */

  // diff.applyPatch()
}
