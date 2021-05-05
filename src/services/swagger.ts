import * as fs from 'fs'
import ui from './ui'
import * as jsonHelper from './json'

export const sdkVersionSuffixPattern = /-SDK\.(\d+)/

/**
 * get patch level from a swagger spec
 * @param {Record<string, any>} swagger - swagger spec
 *
 * @returns {number} patch level
 */
export function getVersionPatchLevel(swagger: Record<string, any>): number {

  if (swagger.info === undefined || swagger.info.version === undefined) {
    throw new Error('invalid baseline swagger file; version information not found')
  }

  const match = swagger.info.version.match(sdkVersionSuffixPattern)
  if (match === null || match.length < 2) {
    return 0
  }

  const level = Number(match[1])

  return level
}

export function setPatchLevel(swagger: Record<string, any>, patchLevel: number) {
  if (swagger.info === undefined) {
    swagger.info = {}
  }

  if (swagger.info.version === undefined) {
    swagger.info.version = ''
  }

  swagger.info.version = swagger.info.version.replace(sdkVersionSuffixPattern, '') + `-SDK.${patchLevel}`
}

/**
 * Fixes the patch level in the given file
 * @param {string} fileName - file to fix
 * @param {number} desiredPatchLevel - patch level we want in the file
 */
export function fixPatchLevel(fileName: string, desiredPatchLevel: number) {

  ui.info(`checking patch level in ${fileName}`)

  const json = JSON.parse(fs.readFileSync(fileName).toString())
  const currentLevel = getVersionPatchLevel(json)
  if (currentLevel !== desiredPatchLevel) {
    ui.info(`adjusting patch level to ${desiredPatchLevel} in ${fileName}`)
    setPatchLevel(json, desiredPatchLevel)
    fs.writeFileSync(fileName, jsonHelper.serialize(json))
  }
}

