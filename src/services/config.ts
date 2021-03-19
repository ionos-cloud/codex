import * as fs from 'fs'
import * as path from 'path'
import ui from './ui'

export interface ConfigModel {
  authUrl: string;
  lockUrl: string;
  auth: {
    username: string;
    token: string;
  };
  s3: {
    endpoint: string;
    region: string;
    key: string;
    secret: string;
    bucket: string;
  };
}

export const defaultConfig: ConfigModel = {
  authUrl: 'https://dashboard.platform.ionos.org/gph--service-auth',
  lockUrl: 'https://dashboard.platform.ionos.org/gph--service-lock',
  auth: {
    username: '',
    token: ''
  },
  s3: {
    endpoint: 's3-de-central.profitbricks.com',
    region: 'de',
    key: '',
    secret: '',
    bucket: 'codex'
  }
}

export class Config {

  static fileName = 'config.json'
  dir = ''
  path = ''

  data: ConfigModel = defaultConfig

  getConfigFileName(dir: string): string {
    return path.resolve(dir, Config.fileName)
  }

  load(dir: string) {
    this.dir = dir
    this.path = this.getConfigFileName(dir)
    try {
      if (fs.existsSync(this.path)) {
        ui.debug(`loading config from ${this.path}`)
        const cfg = JSON.parse(fs.readFileSync(this.path).toString())
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
    fs.mkdirSync(this.dir, {recursive: true})
    fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2))
  }

  init() {
    if (!fs.existsSync(this.path)) {
      this.save()
    }
  }

  get(settingPath: string): any {
    const parts = settingPath.split('.')
    let current: any = this.data
    for (const part of parts) {
      if (!Object.keys(current).includes(part)) {
        throw new Error(`configuration setting ${settingPath} not found`)
      }

      current = current[part]
    }

    return current
  }

  set(settingPath: string, value: any): this {
    const parts = settingPath.split('.')
    let current: any = this.data
    for (let i = 0; i < parts.length - 1; i++) {
      if (!Object.keys(current).includes(parts[i])) {
        throw new Error(`configuration setting ${settingPath} not found`)
      }

      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = value
    return this
  }
}

export default new Config()
