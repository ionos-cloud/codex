import * as fs from 'fs'
import * as path from 'path'
import ui from './ui'

export interface ConfigModel {
  authUrl: string;
  lockUrl: string;
  username: string;
  token: string;
}

export const defaultConfig: ConfigModel = {
  authUrl: 'https://dashboard.platform.ionos.org/gph--service-auth',
  lockUrl: 'https://dashboard.platform.ionos.org/gph--service-lock',
  username: '',
  token: ''
}

export class Config {
  static dir = '.codex'
  static fileName = 'config.json'

  data: ConfigModel = defaultConfig

  getConfigFileName(): string {
    return path.resolve(Config.dir, Config.fileName)
  }

  load() {
    try {
      if (fs.existsSync(this.getConfigFileName())) {
        ui.info('loading config')
        const cfg = JSON.parse(fs.readFileSync(this.getConfigFileName()).toString())
        this.data = {
          ...this.data,
          ...cfg
        }
      } else {
        ui.warning('config file not found')
      }
    } catch (error) {
      throw error
    }
  }

  save() {
    fs.writeFileSync(this.getConfigFileName(), JSON.stringify(this.data, null, 2))
  }

  check() {
    if (!fs.existsSync(Config.dir)) {
      throw new Error('this is not a codex project; please run \'codex init\'')
    }
  }
}

export default new Config()
