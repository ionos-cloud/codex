import axios from 'axios'
import ui from './ui'
import config from './config'

export class Api {

  host = 'https://api.ionos.com'
  basePath = 'cloudapi'
  swaggerFile = 'swagger.json'

  getSwaggerPath(version: number): string {
    return `/${this.basePath}/v${version}/${this.swaggerFile}`
  }

  getSwaggerUrl(version: number): string {
    let url = ''
    try {
      url = config.get('specUrl')
    } catch {
      url = `${this.host}${this.getSwaggerPath(version)}`
    }
    return url
  }

  async fetchSwaggerFile(version: number): Promise<Record<string, any>> {
    const url = this.getSwaggerUrl(version)
    ui.debug(`downloading openapi spec from ${url}`)
    try {
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      if (error.response !== undefined && error.response.status !== undefined && error.response.status === 404) {
        throw new Error(`swagger file not found for version ${version}`)
      }
      throw error
    }
  }
}

export default new Api()
