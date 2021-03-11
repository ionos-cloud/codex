import fs from 'fs'
import vdc from '../services/vdc'

export class Config {
  static dir = '.swagman'
  static defaultVersion = 5
  static baselineFileName = 'baseline.json'
  static patchesDir = 'patches'

  public init() {
    fs.mkdirSync(`${Config.dir}/${Config.defaultVersion}/${Config.patchesDir}`, { recursive: true })
    const swagger = vdc.fetch()
    /* create baseline */
    fs.writeFileSync(`${Config.dir}/${Config.defaultVersion}/${Config.baselineFileName}`, JSON.stringify(swagger, null, 2))
  }
}

export default new Config()
