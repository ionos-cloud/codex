import axios from 'axios'
import { Config } from './config'

export class Vdc {

  baseUrl = 'https://api.ionos.com/cloudapi'
  defaultVersion = 5

  public async fetch(version = Config.defaultVersion): Promise<Record<string, any>> {
    const response = await axios.get(this.getUrl(version))
    if (response.status !== 200) {
      throw new Error(`swagger file not found for version ${version}`)
    }

    return response.data
  }

  public getUrl(version = Config.defaultVersion): string {
    return `${this.baseUrl}/v${version}/swagger.json`
  }
}

export default new Vdc()
