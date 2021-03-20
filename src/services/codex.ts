import fs from 'fs'

import vdc from '../services/vdc'
import * as swagger from './swagger'
import * as diff from 'diff'
import ui from './ui'
import state from './state'
import { PatchError } from '../exceptions/patch-error'
import chalk from 'chalk'
import { CodexStorage, PatchesCollection } from '../contract/codex-storage'
import { S3 } from '../storage/s3'

export interface UpstreamUpdateInfo {
  content: string;
  patch: string;
}

export class Codex {

  static defaultVersion = 5

  static jsonIndent = 2

  readonly version: number
  baseline = ''
  baselineJson: Record<string, any> = {}
  patches: PatchesCollection = {}
  versionPatchLevel = 0
  storage: CodexStorage = new S3()

  constructor(version: number) {
    this.version = version
  }

  async init() {

    ui.info('downloading vdc swagger file')
    const swagger = await vdc.fetchSwaggerFile(this.version)

    ui.info('creating baseline')
    await this.storage.writeBaseline(this.version, JSON.stringify(swagger, null, Codex.jsonIndent))

    state.setIdle().save()

    await this.load()
  }

  async load() {

    ui.info(`version: ${chalk.greenBright(`${this.version}`)}`)
    ui.debug('loading baseline')
    this.baseline = await this.storage.readBaseline(this.version)

    ui.debug('parsing baseline json')
    this.baselineJson = JSON.parse(this.baseline)

    ui.debug('parsing patch level from baseline swagger version')
    this.versionPatchLevel = this.getVersionPatchLevel()

    ui.info(`baseline patch level: ${chalk.greenBright(`${this.versionPatchLevel}`)}`)

    ui.debug('fetching patches')
    this.patches = await this.storage.fetchPatches(this.version)

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

  /**
   * apply the given patch
   *
   * @param {string} target - content to apply the patch on
   * @param {number} patchNumber - patch number
   *
   * @returns {string} content with patch applied
   */
  async applyPatch(target: string, patchNumber: number): Promise<string | boolean> {
    return diff.applyPatch(target, await this.storage.readPatch(this.version, patchNumber))
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

    if (level > this.getMaxPatchLevel()) {
      throw new Error(`patch level ${level} not found; maximum patch level is ${this.patches}`)
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

  createPatch(patch: number, from: string, to: string): Codex {
    const content = diff.createPatch('swagger.json', from, to)
    this.storage.writePatch(this.version, patch, content)
    return this
  }

  describePatch(patch: number, desc: string): Codex {
    this.storage.writePatchDescription(this.version, patch, desc)
    return this
  }

  async getPatchDescription(patch: number): Promise<string | undefined> {
    ui.debug(`getting patch description for ${patch}`)
    return this.storage.readPatchDescription(this.version, patch)
  }

  async updateCheck(): Promise<UpstreamUpdateInfo | undefined> {

    const upstream = await vdc.fetchSwaggerFile(this.version)

    const upstreamPatchLevel = swagger.getVersionPatchLevel(upstream)
    if (this.versionPatchLevel > upstreamPatchLevel) {
      throw new Error(`illegal state found: baseline patch level (${this.versionPatchLevel}) is greater than the vdc patch level (${upstreamPatchLevel})`)
    }

    const maxPatchLevel = this.getMaxPatchLevel()
    if (upstreamPatchLevel > maxPatchLevel) {
      throw new Error(`illegal state found: upstream patch level (${upstreamPatchLevel}) is greater than our maximum patch level (${maxPatchLevel})`)
    }

    const normalizedUpstream = JSON.stringify(upstream, null, 2)
    const normalizedBaseline = JSON.stringify(this.baselineJson, null, 2)
    if ((this.versionPatchLevel !== upstreamPatchLevel) || (normalizedBaseline !== normalizedUpstream)) {
      /* change detected */

      let patch = ''
      if (upstreamPatchLevel > 0) {
        const compiled = JSON.stringify(JSON.parse(await this.compile(upstreamPatchLevel)), null, 2)
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
    await this.storage.writeBaseline(this.version, content)

    this.baseline = content
    this.baselineJson = JSON.parse(content)
  }

  async removePatch(patch: number) {
    ui.info(`removing patch ${patch}`)
    await this.storage.removePatch(this.version, patch)
  }
}

