import * as fs from 'fs'

import * as config from './config'
import * as swagger from './swagger'

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
 * get the patch level
 * @param {number} version - swagger version
 *
 * @return {number} patch level
 */
export function getPatchLevel(version: number): number {
  return swagger.getPatchLevel(readJSON(version))
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
