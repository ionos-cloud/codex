import fs from 'fs'
import glob from 'glob'

import vdc from '../services/vdc'
import * as path from 'path'
import * as swagger from './swagger'
import * as diff from 'diff'
import ui from './ui'
import { PatchError } from '../exceptions/patch-error'
import chalk from 'chalk'

export enum Mode {
  IDLE,
  EDIT
}

export enum Status {
  OK,
  PATCH_FAILED
}

export interface VersionState {
  mode: Mode;
  status: Status;
  data: Record<string, any>;
}

export interface UpstreamUpdateInfo {
  content: string;
  patch: string;
}

export class VersionData {

  static dir = '.swagman'
  static defaultVersion = 5
  static baselineFileName = 'baseline.json'
  static patchesDir = 'patches'
  static upstreamDir = 'upstream'
  static versionPrefix = 'v'
  static jsonIndent = 2
  static stateFileName = 'state.json'
  static idleState: VersionState = {
    mode: Mode.IDLE,
    status: Status.OK,
    data: {}
  }

  readonly version: number
  baseline = ''
  baselineJson: Record<string, any> = {}
  numberOfPatches = 0
  versionPatchLevel = 0
  state: VersionState = {
    mode: Mode.IDLE,
    status: Status.OK,
    data: {}
  }

  constructor(version: number) {
    this.version = version
  }

  public getVersionPath(): string {
    return `${VersionData.dir}/${VersionData.versionPrefix}${this.version}`
  }

  public getBaselinePath(): string {
    return `${this.getVersionPath()}/${VersionData.baselineFileName}`
  }

  public getPatchesPath(): string {
    return `${this.getVersionPath()}/${VersionData.patchesDir}`
  }

  public getPatchPath(patchNumber: number): string {
    return `${this.getPatchesPath()}/${patchNumber}.patch`
  }

  public getPatchDescriptionPath(patchNumber: number): string {
    return `${this.getPatchesPath()}/${patchNumber}.txt`
  }

  public getUpstreamPath(): string {
    return `${this.getVersionPath()}/${VersionData.upstreamDir}`
  }

  public getStatePath(): string {
    return `${this.getVersionPath()}/${VersionData.stateFileName}`
  }

  public setState(state: VersionState): VersionData {
    this.state = state
    return this
  }

  public setIdle(): VersionData {
    ui.debug('setting idle state')
    this.state = VersionData.idleState
    return this
  }

  public saveState(): VersionData {
    ui.debug(`saving state: ${JSON.stringify(this.state)}`)
    fs.writeFileSync(this.getStatePath(), JSON.stringify(this.state, null, 2))
    return this
  }

  async init() {

    ui.info('downloading vdc swagger file')
    const swagger = await vdc.fetchSwaggerFile(this.version)

    ui.info('creating patches dir')
    /* create patches path */
    fs.mkdirSync(this.getPatchesPath(), {recursive: true})

    ui.info('creating upstream dir')
    fs.mkdirSync(this.getUpstreamPath(), { recursive: true })

    ui.info('creating baseline')
    /* create baseline file */
    fs.writeFileSync(this.getBaselinePath(), JSON.stringify(swagger, null, VersionData.jsonIndent))

    this.setIdle().saveState()

    this.load()
  }

  load() {
    this.validate()
    ui.info(`version: ${chalk.greenBright(`${this.version}`)}`)
    ui.debug('loading baseline')
    this.baseline = fs.readFileSync(this.getBaselinePath()).toString()

    ui.debug('parsing baseline json')
    this.baselineJson = JSON.parse(this.baseline)

    ui.debug('parsing patch level from baseline swagger version')
    this.versionPatchLevel = this.getVersionPatchLevel()

    ui.info(`baseline patch level: ${chalk.greenBright(`${this.versionPatchLevel}`)}`)

    ui.debug('counting patches')
    this.numberOfPatches = this.countPatches()
    ui.info(`total patches: ${chalk.greenBright(`${this.numberOfPatches}`)}`)

    try {
      ui.debug('loading state')
      this.state = JSON.parse(fs.readFileSync(this.getStatePath()).toString())
    } catch (error) {
      throw new Error(`invalid state for version ${this.version}: ${error.message}`)
    }

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
  public countPatches(): number {
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

  }

  /**
   * validates that the swagman configuration for the specified swagger version is valid
   * @throws Error if the configuration is not valid
   */
  public validate(): void {

    if (!fs.existsSync(VersionData.dir)) {
      throw new Error(`${VersionData.dir} not found`)
    }

    const versionPath = this.getVersionPath()
    if (!fs.existsSync(versionPath)) {
      throw new Error(`${versionPath} not found`)
    }

    const patchesPath = this.getPatchesPath()
    if (!fs.existsSync(patchesPath)) {
      throw new Error(`${patchesPath} not found`)
    }

    const upstreamPath = this.getUpstreamPath()
    if (!fs.existsSync(upstreamPath)) {
      throw new Error(`${upstreamPath} not found`)
    }

    const baselinePath = this.getBaselinePath()
    if (!fs.existsSync(baselinePath)) {
      throw new Error(`${baselinePath} not found`)
    }

    const statePath = this.getStatePath()
    if (!fs.existsSync(statePath)) {
      throw new Error(`${statePath} not found`)
    }

    this.countPatches()
  }

  /**
   * read a patch file with the given number
   *
   * @param {number} patchNumber - patch number to fetch
   *
   * @returns {string} patch contents
   */
  readPatch(patchNumber: number): string {
    return fs.readFileSync(this.getPatchPath(patchNumber)).toString()
  }

  /**
   * apply the given patch
   *
   * @param {string} target - content to apply the patch on
   * @param {number} patchNumber - patch number
   *
   * @returns {string} content with patch applied
   */
  applyPatch(target: string, patchNumber: number): string | boolean {
    return diff.applyPatch(target, this.readPatch(patchNumber))
  }

  /**
   * compile a swagger file from the baseline and the patches up to the specified patch level
   * @param {number} level - the patch level up to which patches will be applied (including)
   *
   * @returns {string} compiled baseline with all patches in it
   */
  compile(level = 0): string {

    if (level > this.numberOfPatches) {
      throw new Error(`patch level ${level} not found; maximum patch level is ${this.numberOfPatches}`)
    }

    ui.info('compiling baseline')
    let content = this.baseline
    if (level === 0) {
      return content
    }

    for (let i = (this.versionPatchLevel > 0 ? this.versionPatchLevel + 1 : 1); i <= level; i++) {
      const patchedContent = this.applyPatch(content, i)
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

  createPatch(patch: number, from: string, to: string): VersionData {
    const content = diff.createPatch('swagger.json', from, to)
    fs.writeFileSync(this.getPatchPath(patch), content)
    return this
  }

  describePatch(patch: number, desc: string): VersionData {
    if (patch > this.numberOfPatches) {
      throw new Error(`cannot work on patch ${patch}; there only ${this.numberOfPatches} patches in total!`)
    }

    const file = this.getPatchDescriptionPath(patch)
    fs.writeFileSync(file, desc)
    return this
  }

  getPatchDescription(patch: number): string | undefined {
    const fileName = this.getPatchDescriptionPath(patch)
    if (fs.existsSync(fileName)) {
      return fs.readFileSync(fileName).toString()
    }
    return undefined
  }

  listPatches(): string[] {
    const ret = []
    for (let i = 1; i <= this.numberOfPatches; i++) {
      const description = this.getPatchDescription(i)
      if (description === undefined) {
        ret.push('<no description>')
      } else {
        ret.push(description)
      }
    }
    return ret
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
        const compiled = JSON.stringify(JSON.parse(this.compile(upstreamPatchLevel)), null, 2)
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
  }

  createNewUpstreamUpdate(update: string): string {
    const updateFileName = this.getNewUpstreamPatchFileName()
    fs.writeFileSync(updateFileName, update)

    return updateFileName
  }

  updateBaseline(content: string) {
    fs.writeFileSync(this.getBaselinePath(), content)

    this.baseline = content
    this.baselineJson = JSON.parse(content)
  }
}

