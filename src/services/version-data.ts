import fs from 'fs'
import glob from 'glob'

import * as vdc from '../services/vdc'
import * as path from 'path'
import * as swagger from './swagger'
import * as diff from 'diff'

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

export class VersionData {

  static dir = '.swagman'
  static defaultVersion = 5
  static baselineFileName = 'baseline.json'
  static patchesDir = 'patches'
  static versionPrefix = 'v'
  static jsonIndent = 2
  static stateFileName = 'state.json'

  readonly #version: number
  #baseline = ''
  #baselineJson: Record<string, any> = {}
  #numberOfPatches = 0
  #versionPatchLevel = 0
  #state: VersionState = {
    mode: Mode.IDLE,
    status: Status.OK,
    data: {}
  }

  constructor(version: number) {
    this.#version = version
  }

  public getVersionPath(): string {
    return `${VersionData.dir}/${VersionData.versionPrefix}${this.#version}`
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

  public getStatePath(): string {
    return `${this.getVersionPath()}/${VersionData.stateFileName}`
  }

  public setState(state: VersionState) {
    fs.writeFileSync(this.getStatePath(), JSON.stringify(state, null, 2))
    this.#state = state
  }

  async init() {
    const swagger = await vdc.fetchSwaggerFile(this.#version)

    /* create patches path */
    fs.mkdirSync(this.getPatchesPath(), {recursive: true})

    /* create baseline file */
    fs.writeFileSync(this.getBaselinePath(), JSON.stringify(swagger, null, VersionData.jsonIndent))

    this.setState({mode: Mode.IDLE, status: Status.OK, data: {}})

    this.load()
  }

  load() {
    this.validate()
    this.#baseline = fs.readFileSync(this.getBaselinePath()).toString()
    this.#baselineJson = JSON.parse(this.#baseline)
    this.#versionPatchLevel = this.getVersionPatchLevel()
    this.#numberOfPatches = this.countPatches()
    try {
      this.#state = JSON.parse(fs.readFileSync(this.getStatePath()).toString())
    } catch (error) {
      throw new Error(`invalid state for version ${this.#version}: ${error.message}`)
    }
  }

  getBaseline(): string {
    return this.#baseline
  }

  getBaselineJSON(): Record<string, any> {
    return this.#baselineJson
  }

  getVersionPatchLevel(): number {
    return swagger.getVersionPatchLevel(this.#baselineJson)
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

    /* apply patches in sequence */
    const currentPatchLevel = this.getVersionPatchLevel()
    const totalPatches = this.countPatches()

    if (level > totalPatches) {
      throw new Error(`patch level ${level} not found; maximum patch level is ${totalPatches}`)
    }

    let content = this.#baseline
    for (let i = currentPatchLevel; i <= totalPatches; i++) {
      const patchedContent = this.applyPatch(content, i)
      if (patchedContent === false) {
        /* patch failed, mark the state and throw */
        return content
      }
      content = patchedContent as string
    }

    return content

  }

}

