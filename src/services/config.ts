import fs from 'fs'
import * as vdc from '../services/vdc'

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
