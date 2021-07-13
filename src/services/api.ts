import axios from 'axios'
import ui from './ui'
import config from './config'

export class Api {

  async fetchSwaggerFile(): Promise<Record<string, any>> {
    const url = config.data.apiSpecUrl
    ui.debug(`downloading openapi spec from ${url}`)
    try {
      const response = await axios.get(url)
      return response.data
    } catch (error) {
      if (error.response !== undefined && error.response.status !== undefined && error.response.status === 404) {
        throw new Error(`swagger file not found at ${url}`)
      }
      throw error
    }
  }
}

export default new Api()
