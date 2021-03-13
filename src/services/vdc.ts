import axios from 'axios'
import ui from './ui'

export class Vdc {

  host = 'https://api.ionos.com'
  basePath = 'cloudapi'
  swaggerFile = 'swagger.json'

  getSwaggerPath(version: number): string {
    return `/${this.basePath}/v${version}/${this.swaggerFile}`
  }

  getSwaggerUrl(version: number): string {
    return `${this.host}${this.getSwaggerPath(version)}`
  }

  async fetchSwaggerFile(version: number): Promise<Record<string, any>> {
    const url = this.getSwaggerUrl(version)
    ui.debug(`downloading vdc swagger from ${url}`)
    const response = await axios.get(url)
    if (response.status !== 200) {
      throw new Error(`swagger file not found for version ${version}`)
    }

    return response.data
  }
}

export default new Vdc()
