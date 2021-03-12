import fs from 'fs'
import glob from 'glob'

import * as vdc from '../services/vdc'
import * as path from 'path'

export const dir = '.swagman'
export const defaultVersion = 5
export const baselineFileName = 'baseline.json'
export const patchesDir = 'patches'
export const versionPrefix = 'v'
export const jsonIndent = 2

export function getVersionPath(version = defaultVersion): string {
  return `${dir}/${versionPrefix}${version}`
}

export function getBaselinePath(version = defaultVersion): string {
  return `${getVersionPath(version)}/${baselineFileName}`
}

export function getPatchesPath(version = defaultVersion): string {
  return `${getVersionPath(version)}/${patchesDir}`
}

export async function init() {
  const swagger = await vdc.fetchSwaggerFile()

  /* create patches path */
  fs.mkdirSync(getPatchesPath(), { recursive: true })

  /* create baseline file */
  fs.writeFileSync(getBaselinePath(), JSON.stringify(swagger, null, jsonIndent))
}

export function getPatchPath(version: number, patchNumber: number): string {
  return `${getPatchesPath(version)}/${patchNumber}.patch`
}

/**
 * Count the number of patches for the specified version
 *
 * @param {number} version - swagger version
 *
 * @returns {number} the number of patches found
 * @throws Error if patches are not in sequential order
 */
export function countPatches(version: number): number {
  const patchesPath = getPatchesPath(version)

  const numbers: number[] = []
  for (const file of glob.sync(`${patchesPath}/*.patch`)) {
    const match = path.basename(file).match(/^(\d+)\.patch$/)
    if (match !== null && match.length === 2) {
      numbers.push(Number(match[1]))
    }
  }

  const sorted = numbers.sort((a: number, b: number) => (a < b) ? -1 : ((a > b) ? 1 : 0))
  let prev: number | undefined
  for (const x of sorted) {
    if (prev !== undefined) {
      if (x - prev !== 1) {
        throw new Error(`patches out of order: after patch ${prev} comes patch ${x}`)
      }
    }
    prev = x
  }

  return prev || 0;

}

/**
 * validates that the swagman configuration for the specified swagger version is valid
 * @param {number} version - swagger version
 * @throws Error if the configuration is not valid
 */
export function validate(version: number): void {

  if (!fs.existsSync(dir)) {
    throw new Error(`${dir} not found`)
  }

  const versionPath = getVersionPath(version)
  if (!fs.existsSync(versionPath)) {
    throw new Error(`${versionPath} not found`)
  }

  const patchesPath = getPatchesPath(version)
  if (!fs.existsSync(patchesPath)) {
    throw new Error(`${patchesPath} not found`)
  }

  countPatches(version)
}
