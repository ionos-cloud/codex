import fs from 'fs'

import * as json from '../services/json'
import * as swagger from './swagger'
import * as diff from 'diff'
import ui from './ui'
import state from './state'
import { PatchError } from '../exceptions/patch-error'
import chalk from 'chalk'
import { CodexStorage, PatchesCollection } from '../contract/codex-storage'
import { S3 } from '../storage/s3'
import axios from 'axios'

export interface UpstreamUpdateInfo {
  content: string;
  patch: string;
}

export class Codex {

  static jsonIndent = 4

  baseline = ''
  baselineJson: Record<string, any> = {}
  patches: PatchesCollection = {}
  versionPatchLevel = 0
  storage: CodexStorage

  constructor(storage: CodexStorage = new S3()) {
    this.storage = storage
  }

  async init(apiSpecUrl: string) {

    ui.info('downloading api spec file')
    const swagger = await this.fetchSwaggerFile(apiSpecUrl)

    ui.info('creating api config')
    await this.storage.writeApiConfig({
      specUrl: apiSpecUrl
    })

    ui.info('creating baseline')
    await this.storage.writeBaseline(json.serialize(swagger, Codex.jsonIndent))

    state.setIdle().save()

    await this.load()
  }

  async load() {

    ui.debug('loading api config')
    await this.storage.getApiConfig()

    ui.debug('loading baseline')
    this.baseline = await this.storage.readBaseline()

    ui.debug('parsing baseline json')
    this.baselineJson = JSON.parse(this.baseline)

    ui.debug('parsing patch level from baseline swagger file')
    this.versionPatchLevel = this.getVersionPatchLevel()

    ui.info(`baseline patch level: ${chalk.greenBright(`${this.versionPatchLevel}`)}`)

    ui.debug('fetching patches')
    this.patches = await this.storage.fetchPatches()

    ui.info(`total patches: ${chalk.greenBright(`${Object.keys(this.patches).length}`)}`)

  }

  getBaseline(): string {
    return this.baseline
  }

  getBaselineJSON(): Record<string, any> {
    return this.baselineJson
  }

  getVersionPatchLevel(): number {
    return swagger.getVersionPatchLevel(this.baselineJson)
  }

  patchExists(patch: number): boolean {
    return Object.keys(this.patches).map(v => Number(v)).includes(patch)
  }

  /**
   * apply the given patch
   *
   * @param {string} target - content to apply the patch on
   * @param {number} patchNumber - patch number
   *
   * @returns {string} content with patch applied
   */
  async applyPatch(target: string, patchNumber: number): Promise<string | boolean> {
    return diff.applyPatch(target, await this.storage.readPatch(patchNumber))
  }

  getMaxPatchLevel(): number {
    const levels: Array<keyof PatchesCollection> = Object.keys(this.patches).map(k => Number(k))
    return levels.length === 0 ? 0 : levels[levels.length - 1]
  }

  /**
   * compile a swagger file from the baseline and the patches up to the specified patch level
   * @param {number} level - the patch level up to which patches will be applied (including)
   *
   * @returns {string} compiled baseline with all patches in it
   */
  async compile(level = 0): Promise<string> {

    const maxPatchLevel = this.getMaxPatchLevel()
    if (level > maxPatchLevel) {
      throw new Error(`patch level ${level} not found; maximum patch level is ${maxPatchLevel}`)
    }

    ui.info('compiling baseline')
    let content = this.baseline
    if (level === 0) {
      return content
    }

    // for (let i = (this.versionPatchLevel > 0 ? this.versionPatchLevel + 1 : 1); i <= level; i++) {
    for (const i of Object.keys(this.patches).map(k => Number(k))) {
      if (i < this.versionPatchLevel + 1 || i > level) continue
      // eslint-disable-next-line no-await-in-loop
      const patchedContent = await this.applyPatch(content, i)
      ui.debug(`applying patch ${i}`)
      if (patchedContent === false) {
        ui.error(`failed to apply patch ${i}`)
        /* patch failed, mark the state and throw */
        throw new PatchError('failed to apply patch', i, content)
      }
      content = patchedContent as string
    }

    return content

  }

  async compileAll(): Promise<string> {
    return this.compile(this.getMaxPatchLevel())
  }

  createPatch(patch: number, from: string, to: string): Codex {
    const content = diff.createPatch('swagger.json', from, to)
    this.storage.writePatch(patch, content)
    return this
  }

  describePatch(patch: number, desc: string): Codex {
    this.storage.writePatchDescription(patch, desc)
    return this
  }

  async getPatchDescription(patch: number): Promise<string | undefined> {
    ui.debug(`getting patch description for ${patch}`)
    return this.storage.readPatchDescription(patch)
  }

  async getPatch(patch: number): Promise<string> {
    return this.storage.readPatch(patch)
  }

  async updateCheck(): Promise<UpstreamUpdateInfo | undefined> {

    const upstream = await this.fetchSwaggerFile()

    const upstreamPatchLevel = swagger.getVersionPatchLevel(upstream)
    if (this.versionPatchLevel > upstreamPatchLevel) {
      throw new Error(`illegal state found: baseline patch level (${this.versionPatchLevel}) is greater than the vdc patch level (${upstreamPatchLevel})`)
    }

    const maxPatchLevel = this.getMaxPatchLevel()
    if (upstreamPatchLevel > maxPatchLevel) {
      throw new Error(`illegal state found: upstream patch level (${upstreamPatchLevel}) is greater than our maximum patch level (${maxPatchLevel})`)
    }

    const normalizedUpstream = json.serialize(upstream)
    const normalizedBaseline = json.serialize(this.baselineJson)
    if ((this.versionPatchLevel !== upstreamPatchLevel) || (normalizedBaseline !== normalizedUpstream)) {
      /* change detected */

      let patch
      if (upstreamPatchLevel > 0) {
        const compiled = json.serialize(JSON.parse(await this.compile(upstreamPatchLevel)))
        patch = diff.createPatch('swagger.json', compiled, normalizedUpstream)
      } else {
        patch = diff.createPatch('swagger.json', normalizedBaseline, normalizedUpstream)
      }

      return {
        patch,
        content: normalizedUpstream
      }
    }

    return undefined
  }

  createNewUpstreamUpdate(update: string, updateFileName: string): string {
    fs.writeFileSync(updateFileName, update)
    return updateFileName
  }

  async updateBaseline(content: string) {
    await this.storage.writeBaseline(content)

    this.baseline = content
    this.baselineJson = JSON.parse(content)
  }

  async removePatch(patch: number) {
    ui.info(`removing patch ${patch}`)
    await this.storage.removePatch(patch)
  }

  async fetchSwaggerFile(specUrl?: string): Promise<Record<string, any>> {

    specUrl = specUrl || (await this.storage.getApiConfig()).specUrl

    ui.debug(`downloading openapi spec from ${specUrl}`)

    try {
      const response = await axios.get(specUrl)
      return response.data
    } catch (error) {
      if (error.response !== undefined && error.response.status !== undefined && error.response.status === 404) {
        throw new Error(`swagger file not found at ${specUrl}`)
      }
      throw error
    }
  }
}

