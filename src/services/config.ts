import * as fs from 'fs'
import * as path from 'path'
import ui from './ui'
import * as json from './json'

const DEFAULT_AUTH_API_URL = 'https://dashboard.platform.ionos.org/gph--service-auth'
const DEFAULT_LOCK_API_URL = 'https://dashboard.platform.ionos.org/gph--service-lock'
const DEFAULT_API_SPEC_URL = 'https://api.ionos.com/cloudapi/v5/swagger.json'
const DEFAULT_S3_ENDPOINT = 's3-de-central.profitbricks.com'
const DEFAULT_S3_REGION = 'de'
const DEFAULT_S3_BUCKET = 'codex'

export interface ConfigModel {
  authUrl: string;
  lockUrl: string;
  apiSpecUrl: string;
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
  authUrl: DEFAULT_AUTH_API_URL,
  lockUrl: DEFAULT_LOCK_API_URL,
  apiSpecUrl: DEFAULT_API_SPEC_URL,
  auth: {
    username: '',
    token: ''
  },
  s3: {
    endpoint: DEFAULT_S3_ENDPOINT,
    region: DEFAULT_S3_REGION,
    key: '',
    secret: '',
    bucket: DEFAULT_S3_BUCKET
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

  load(dir: string, validate = true) {
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

    if (validate) {
      this.validate()
    }

  }

  save() {
    fs.mkdirSync(this.dir, {recursive: true})
    fs.writeFileSync(this.path, json.serialize(this.data))
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

  validate() {
    if (this.data.apiSpecUrl === undefined || this.data.apiSpecUrl === '') {
      throw new Error('apiSpecUrl not found in config; please run `config apiSpecUrl http://your.api/spec`')
    }
  }
}

export default new Config()
