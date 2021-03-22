import aws = require('aws-sdk')

import { CodexStorage, PatchesCollection } from '../contract/codex-storage'
import config from '../services/config'
import ui from '../services/ui'
import { basename } from 'path'

export class S3 implements CodexStorage {

  static baselineFileName = 'baseline.json'
  static patchesDir = 'patches'
  static versionPrefix = 'v'

  s3 = new aws.S3({
    accessKeyId: config.data.s3.key,
    secretAccessKey: config.data.s3.secret,
    endpoint: config.data.s3.endpoint,
    region: config.data.s3.region,
  })

  bucket = config.data.s3.bucket

  constructor() {
    if (config.data.s3.key === undefined || config.data.s3.key.trim().length === 0) {
      throw new Error('[s3] invalid s3 config: missing key; run \'codex config s3.key <your s3 key>\'')
    }

    if (config.data.s3.secret === undefined || config.data.s3.secret.trim().length === 0) {
      throw new Error('[s3] invalid s3 config: missing secret; run \'codex config s3.secret <your s3 key>\'')
    }

  }

  protected async readFile(path: string): Promise<string> {
    ui.debug(`[s3] reading file ${path}`)
    let data
    try {
      data = await this.s3.getObject({
        Bucket: this.bucket,
        Key: path,
      }).promise()
    } catch (error) {
      ui.debug(error.stack)
      throw new Error(`[s3] could not read file ${path}: ${error.message}`)
    }

    if (data.Body === undefined) {
      throw new Error(`[s3] could not read file ${path}`)
    }

    return data.Body.toString()
  }

  protected async writeFile(path: string, content: string) {
    try {
      await this.s3.upload({
        Bucket: this.bucket,
        Key: path,
        Body: Buffer.from(content, 'utf8')
      }).promise()
    } catch (error) {
      ui.debug(error.stack)
      throw new Error(`[s3] could not save file ${path}: ${error.message}`)
    }

  }

  protected async removeFile(path: string) {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: path
      }).promise()
    } catch (error) {
      ui.debug(error.stack)
      throw new Error(`[s3] could not remove file ${path}: ${error.message}`)
    }
  }

  public getVersionPath(version: number): string {
    return `${S3.versionPrefix}${version}`
  }

  public getBaselinePath(version: number): string {
    return `${this.getVersionPath(version)}/${S3.baselineFileName}`
  }

  public getPatchesPath(version: number): string {
    return `${this.getVersionPath(version)}/${S3.patchesDir}`
  }

  public getPatchPath(version: number, patchNumber: number): string {
    return `${this.getPatchesPath(version)}/${patchNumber}.patch`
  }

  public getPatchDescriptionPath(version: number, patchNumber: number): string {
    return `${this.getPatchesPath(version)}/${patchNumber}.txt`
  }

  readBaseline(version: number): Promise<string> {
    return this.readFile(this.getBaselinePath(version))
  }

  readPatch(version: number, patch: number): Promise<string> {
    return this.readFile(this.getPatchPath(version, patch))
  }

  async writeBaseline(version: number, content: string) {
    await this.writeFile(this.getBaselinePath(version), content)
  }

  async writePatch(version: number, patch: number, content: string) {
    await this.writeFile(this.getPatchPath(version, patch), content)
  }

  async readPatchDescription(version: number, patch: number): Promise<string> {
    try {
      const d = await this.readFile(this.getPatchDescriptionPath(version, patch))
      return d
    } catch (error) {
      ui.debug(error)
      ui.warning(`[s3] could not read patch ${patch} description: ${error.message}`)
      return ''
    }
  }

  async writePatchDescription(version: number, patch: number, content: string) {
    await this.writeFile(this.getPatchDescriptionPath(version, patch), content)
  }

  async fetchPatches(version: number): Promise<PatchesCollection> {
    const numbers: number[] = []
    const path = this.getPatchesPath(version) + '/'
    try {
      const data = await this.s3.listObjectsV2({
        Bucket: this.bucket,
        Prefix: path
      }).promise()

      if (data.Contents === undefined) {
        ui.warning('no patches found; got an empty response from S3')
        return {}
      }

      for (const entry of data.Contents) {
        if (entry.Key === path || entry.Key === undefined) continue

        const match = basename(entry.Key).match(/^(\d+)\.patch$/)

        if (match !== null && match !== undefined && match.length === 2) {
          numbers.push(Number(match[1]))
        }

      }

    } catch (error) {
      ui.debug(error)
      throw new Error(`[s3] could not read the list of patches: ${error.message}`)
    }

    const sorted = numbers.sort((a: number, b: number) => (a < b) ? -1 : ((a > b) ? 1 : 0))

    const ret: PatchesCollection = {}

    const descriptions = await Promise.all(sorted.map(async (value: number) => this.readPatchDescription(version, value)))

    for (let idx = 0; idx < sorted.length; idx++) {
      ret[sorted[idx]] = descriptions[idx] === undefined ? '<no description>' : descriptions[idx]
    }

    return ret

  }

  async removePatch(version: number, patch: number) {
    await this.removeFile(this.getPatchPath(version, patch))
    await this.removePatchDescription(version, patch)
  }

  async removePatchDescription(version: number, patch: number) {
    await this.removeFile(this.getPatchDescriptionPath(version, patch))
  }

}
