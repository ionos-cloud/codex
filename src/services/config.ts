import * as fs from 'fs'
import * as path from 'path'
import cli from 'cli-ux'
import ui from './ui'

export interface ConfigModel {
  authUrl: string;
  lockUrl: string;
  username: string;
  token: string;
}

export const defaultConfig: ConfigModel = {
  authUrl: 'https://staging-ws.platform.ionos.org/shared/gph--service-auth',
  lockUrl: 'https://staging-ws.platform.ionos.org/shared/gph--service-lock',
  username: '',
  token: ''
}

export class Config {
  static dir = '.swagman'
  static fileName = 'config.josn'

  data: ConfigModel = defaultConfig

  constructor() {
    this.load()
  }

  getConfigFileName(): string {
    return path.resolve(Config.dir, Config.fileName)
  }

  load() {
    ui.info('loading config')
    try {
      const cfg = JSON.parse(fs.readFileSync(this.getConfigFileName()).toString())
      this.data = {
        ...this.data,
        ...cfg
      }
    } catch (error) {
      throw error
    }
  }

  save() {
    fs.writeFileSync(this.getConfigFileName(), JSON.stringify(this.data, null, 2))
  }
}

export default new Config()
