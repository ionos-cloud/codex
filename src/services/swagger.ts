import * as fs from 'fs'
import ui from './ui'
import { CodexRenderer } from '../contract/codex-renderer'

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

  return Number(match[1])
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
 * @param {CodexRenderer} renderer - renderer to use for reading and writing the spec
 */
export function fixPatchLevel(fileName: string, desiredPatchLevel: number, renderer: CodexRenderer) {

  ui.info(`checking patch level in ${fileName}`)

  const spec = renderer.unmarshal(fs.readFileSync(fileName).toString())
  const currentLevel = getVersionPatchLevel(spec)
  if (currentLevel !== desiredPatchLevel) {
    ui.info(`adjusting patch level to ${desiredPatchLevel} in ${fileName}`)
    setPatchLevel(spec, desiredPatchLevel)
    fs.writeFileSync(fileName, renderer.marshal(spec))
  }
}

