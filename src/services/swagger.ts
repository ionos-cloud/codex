export const sdkVersionSuffixPattern = /-SDK\.(\d+)/

/**
 * get patch level from a swagger spec
 * @param {Record<string, any>} swagger - swagger spec
 *
 * @returns {number} patch level
 */
export function getPatchLevel(swagger: Record<string, any>): number {

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
