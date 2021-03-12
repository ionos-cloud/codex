import axios from 'axios'

export const host = 'https://api.ionos.com'
export const basePath = 'cloudapi'
export const swaggerFile = 'swagger.json'

export function getSwaggerPath(version: number): string {
  return `/${basePath}/v${version}/${swaggerFile}`
}

export function getSwaggerUrl(version: number): string {
  return `${host}${getSwaggerPath(version)}`
}

export async function fetchSwaggerFile(version: number): Promise<Record<string, any>> {
  const response = await axios.get(getSwaggerUrl(version))
  if (response.status !== 200) {
    throw new Error(`swagger file not found for version ${version}`)
  }

  return response.data
}
