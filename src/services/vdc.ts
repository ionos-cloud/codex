import axios from 'axios'
import * as config from './config'

export const host = 'https://api.ionos.com'
export const basePath = 'cloudapi'
export const swaggerFile = 'swagger.json'

export function getSwaggerPath(version = config.defaultVersion): string {
  return `/${basePath}/v${version}/${swaggerFile}`
}

export function getSwaggerUrl(version = config.defaultVersion): string {
  return `${host}${getSwaggerPath(version)}`
}

export async function fetchSwaggerFile(version = config.defaultVersion): Promise<Record<string, any>> {
  const response = await axios.get(getSwaggerUrl(version))
  if (response.status !== 200) {
    throw new Error(`swagger file not found for version ${version}`)
  }

  return response.data
}
