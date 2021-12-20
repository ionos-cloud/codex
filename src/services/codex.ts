import fs from 'fs'

import * as swagger from './swagger'
import * as diff from 'diff'
import ui from './ui'
import state from './state'
import {PatchError} from '../exceptions/patch-error'
import chalk from 'chalk'
import {ApiConfig, CodexFormat, CodexStorage, PatchesCollection} from '../contract/codex-storage'
import {S3} from '../storage/s3'
import axios from 'axios'
import {CodexRenderer} from '../contract/codex-renderer'
import renderers, {DEFAULT_RENDERER} from '../renderers'

export interface UpstreamUpdateInfo {
  content: string;
  patch: string;
}

export class Codex {

  static indent = 4
  static defaultFileName = 'swagger'

  baselineStr = ''
  baseline: Record<string, any> = {}
  patches: PatchesCollection = {}
  versionPatchLevel = 0
  storage: CodexStorage
  renderer: CodexRenderer = renderers[DEFAULT_RENDERER]
  apiConfig?: ApiConfig

  constructor(storage: CodexStorage = new S3()) {
    this.storage = storage
  }

  async init(apiConfig: ApiConfig) {

    ui.info('downloading api spec file')
    const swagger = await this.fetchSwaggerFile(apiConfig.specUrl)

    ui.info('creating api config')
    this.apiConfig = apiConfig
    await this.storage.writeApiConfig(apiConfig)
    this.renderer = this.getRenderer(apiConfig.format)

    ui.info('creating baseline')
    await this.storage.writeBaseline(this.renderer.marshal(swagger, Codex.indent))

    state.setIdle().save()

    await this.load()
  }

  async load() {

    ui.debug('loading api config')
    this.apiConfig = await this.storage.getApiConfig()
    this.renderer = this.getRenderer(this.apiConfig.format)

    ui.debug('loading baseline')
    this.baselineStr = await this.storage.readBaseline()

    ui.debug('parsing baseline')
    this.baseline = this.renderer.unmarshal(this.baselineStr)

    ui.debug('parsing patch level from baseline swagger file')
    this.versionPatchLevel = this.getVersionPatchLevel()

    ui.info(`baseline patch level: ${chalk.greenBright(`${this.versionPatchLevel}`)}`)

    ui.debug('fetching patches')
    this.patches = await this.storage.fetchPatches()

    ui.info(`total patches: ${chalk.greenBright(`${Object.keys(this.patches).length}`)}`)

  }

  getRenderer(format?: CodexFormat): CodexRenderer {
    if (format === undefined) {
      if (this.apiConfig?.format === undefined) {
        throw new Error('codex.getRenderer(): format not specified and apiConfig not initialized')
      }
      format = this.apiConfig?.format
    }
    if (renderers[format] === undefined) {
      throw new Error(`codex renderer ${format} not found`)
    }

    return renderers[format]
  }

  getBaselineString(): string {
    return this.baselineStr
  }

  getBaseline(): Record<string, any> {
    return this.baseline
  }

  getVersionPatchLevel(): number {
    return swagger.getVersionPatchLevel(this.baseline)
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
    let content = this.baselineStr
    if (level === 0) {
      return content
    }

    const upstream = await this.fetchSwaggerFile()
    const upstreamPatchLevel = swagger.getVersionPatchLevel(upstream)

    // apply only last patch
    if (level > upstreamPatchLevel) {
      content = await this.applyLastPatch(content, level);
    } else if (level === upstreamPatchLevel && this.versionPatchLevel < upstreamPatchLevel) {
      // apply only last patch if it is deployed in production and baseline is not yet updated
      ui.debug(`upstream patch level: ${upstreamPatchLevel}, baseline patch level: ${this.versionPatchLevel}`)
      ui.debug(`patch ${level} is deployed in upstream, baseline is not updated`)

      content = await this.applyLastPatch(content, level);
    } else {
      ui.debug('there is no patch to apply')
    }

    return content
  }

  private async applyLastPatch(content: string, level: number) {
    const patchedContent = await this.applyPatch(content, level)
    ui.debug(`applying patch ${level}`)
    if (patchedContent === false) {
      ui.error(`failed to apply patch ${level}`)
      /* patch failed, mark the state and throw */
      throw new PatchError('failed to apply patch', level, content)
    }
    return patchedContent as string
  }

  async compileAll(): Promise<string> {
    return this.compile(this.getMaxPatchLevel())
  }

  getDefaultFileName(): string {
    return `${Codex.defaultFileName}.${this.apiConfig?.format}`
  }

  createPatch(patch: number, from: string, to: string): Codex {
    const content = diff.createPatch(this.getDefaultFileName(), from, to)
    this.storage.writePatch(patch, content)
    return this
  }

  describePatch(patch: number, desc: string): Codex {
    this.storage.writePatchDescription(patch, desc)
    return this
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

    const normalizedUpstream = this.renderer.marshal(upstream)
    const normalizedBaseline = this.renderer.marshal(this.baseline)
    if ((this.versionPatchLevel !== upstreamPatchLevel) || (normalizedBaseline !== normalizedUpstream)) {
      /* change detected */

      let patch
      if (upstreamPatchLevel > 0) {
        /* unmarshal + marshal to normalize the format */
        const compiled = this.renderer.marshal(this.renderer.unmarshal(await this.compile(upstreamPatchLevel)))
        patch = diff.createPatch(this.getDefaultFileName(), compiled, normalizedUpstream)
      } else {
        patch = diff.createPatch(this.getDefaultFileName(), normalizedBaseline, normalizedUpstream)
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

    this.baselineStr = content
    this.baseline = this.renderer.unmarshal(content)
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
      if (response.headers['content-type'] === 'text/yaml') {
        ui.debug('got an yaml spec')
        return renderers.yaml.unmarshal(response.data)
      }
      ui.debug('got a json spec')
      return response.data
    } catch (error) {
      if (error.response !== undefined && error.response.status !== undefined && error.response.status === 404) {
        throw new Error(`swagger file not found at ${specUrl}`)
      }
      throw error
    }
  }
}

