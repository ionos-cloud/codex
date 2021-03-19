import fs from 'fs'

import vdc from '../services/vdc'
import * as swagger from './swagger'
import * as diff from 'diff'
import ui from './ui'
import state from './state'
import { PatchError } from '../exceptions/patch-error'
import chalk from 'chalk'
import { CodexStorage } from '../contract/codex-storage'
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
  numberOfPatches = 0
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

    ui.debug('counting patches')
    this.numberOfPatches = await this.storage.countPatches(this.version)

    ui.info(`total patches: ${chalk.greenBright(`${this.numberOfPatches}`)}`)

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

  getNumberOfPatches(): number {
    return this.numberOfPatches
  }

  /**
   * Count the number of patches for the specified version
   *
   * @returns {number} the number of patches found
   * @throws Error if patches are not in sequential order
   */
  /* public countPatches(): number {
    const patchesPath = this.getPatchesPath()

    const numbers: number[] = []
    for (const file of glob.sync(`${patchesPath}/*.patch`)) {
      const match = path.basename(file).match(/^(\d+)\.patch$/)
      if (match !== null && match.length === 2) {
        numbers.push(Number(match[1]))
      }
    }

    const sorted = numbers.sort((a: number, b: number) => (a < b) ? -1 : ((a > b) ? 1 : 0))
    let prev: number | undefined
    for (const x of sorted) {
      if (prev !== undefined) {
        if (x - prev !== 1) {
          throw new Error(`patches out of order: after patch ${prev} comes patch ${x}`)
        }
      }
      prev = x
    }

    return prev || 0;

  }  */

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

  /**
   * compile a swagger file from the baseline and the patches up to the specified patch level
   * @param {number} level - the patch level up to which patches will be applied (including)
   *
   * @returns {string} compiled baseline with all patches in it
   */
  async compile(level = 0): Promise<string> {

    if (level > this.numberOfPatches) {
      throw new Error(`patch level ${level} not found; maximum patch level is ${this.numberOfPatches}`)
    }

    ui.info('compiling baseline')
    let content = this.baseline
    if (level === 0) {
      return content
    }

    for (let i = (this.versionPatchLevel > 0 ? this.versionPatchLevel + 1 : 1); i <= level; i++) {
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
    return this.storage.readPatchDescription(this.version, patch)
  }

  async listPatches(): Promise<string[]> {
    const descriptions = await Promise.all(new Array(this.numberOfPatches).map((_, i) => this.getPatchDescription(i)))
    return descriptions.map((d: string | undefined) => (d === undefined) ? '<no description>' : d)
  }

  async updateCheck(): Promise<UpstreamUpdateInfo | undefined> {

    const upstream = await vdc.fetchSwaggerFile(this.version)

    const upstreamPatchLevel = swagger.getVersionPatchLevel(upstream)
    if (this.versionPatchLevel > upstreamPatchLevel) {
      throw new Error(`illegal state found: baseline patch level (${this.versionPatchLevel}) is greater than the vdc patch level (${upstreamPatchLevel})`)
    }

    if (upstreamPatchLevel > this.numberOfPatches) {
      throw new Error(`illegal state found: upstream patch level is ${upstreamPatchLevel} but we only have ${this.numberOfPatches} patches`)
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

  /*
  getNewUpstreamPatchFileName(): string {
    const now = new Date()
    const padZeros =
      (...numbers: number[]): string =>
        numbers.reduce(
          (prev: string, current: number): string => `${prev}${current > 10 ? current : `0${current}`}`, ''
        )
    const timestamp = padZeros(
      now.getFullYear(),
      now.getMonth() + 1,
      now.getDate(),
      now.getHours(),
      now.getMinutes(),
      now.getSeconds()
    )
    return `${this.getUpstreamPath()}/upstream-update-${timestamp}.patch`
  } */

  createNewUpstreamUpdate(update: string, updateFileName: string): string {
    // const updateFileName = this.getNewUpstreamPatchFileName()
    fs.writeFileSync(updateFileName, update)

    return updateFileName
  }

  async updateBaseline(content: string) {
    await this.storage.writeBaseline(this.version, content)

    this.baseline = content
    this.baselineJson = JSON.parse(content)
  }
}

