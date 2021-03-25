import { CodexStorage, PatchesCollection } from '../../src/contract/codex-storage'
import { basename } from 'path'
import ui from '../../src/services/ui'

export class Storage implements CodexStorage {

  static baselineFileName = 'baseline.json'
  static patchesDir = 'patches'
  static versionPrefix = 'v'

  fsMock: Record<string, any> = {}

  constructor(fs: Record<string, any>) {
    this.fsMock = fs
  }

  addMock(data: Record<string, any>): this {
    this.fsMock = {
      ...this.fsMock,
      ...data
    }
    return this
  }

  setMock(data: Record<string, any>): this {
    this.fsMock = data
    return this
  }

  protected resolvePath(path: string) {
    const parts = path.split('/')
    let current: any = this.fsMock
    for (const part of parts) {
      if (!Object.keys(current).includes(part)) {
        throw new Error(`path ${path} not found`)
      }

      current = current[part]
    }

    return current
  }

  protected async readFile(path: string): Promise<string> {
    const content = this.resolvePath(path)
    if (typeof content !== 'string') {
      throw new TypeError(`${path} is a directory`)
    }
    return content
  }

  protected async writeFile(path: string, content: string) {
    const parts = path.split('/')
    let current: any = this.fsMock
    for (let i = 0; i < parts.length - 1; i++) {
      if (!Object.keys(current).includes(parts[i])) {
        throw new Error(`path ${path} not found`)
      }

      current = current[parts[i]]
    }
    current[parts[parts.length - 1]] = content
  }

  protected async removeFile(path: string) {
    const parts = path.split('/')
    let current: any = this.fsMock
    for (let i = 0; i < parts.length - 1; i++) {
      if (!Object.keys(current).includes(parts[i])) {
        throw new Error(`path ${path} not found`)
      }

      current = current[parts[i]]
    }
    delete current[parts[parts.length - 1]]
  }

  public getVersionPath(version: number): string {
    return `${Storage.versionPrefix}${version}`
  }

  public getBaselinePath(version: number): string {
    return `${this.getVersionPath(version)}/${Storage.baselineFileName}`
  }

  public getPatchesPath(version: number): string {
    return `${this.getVersionPath(version)}/${Storage.patchesDir}`
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
      ui.warning(`[storage-mock] could not read patch ${patch} description: ${error.message}`)
      return ''
    }
  }

  async writePatchDescription(version: number, patch: number, content: string) {
    await this.writeFile(this.getPatchDescriptionPath(version, patch), content)
  }

  async fetchPatches(version: number): Promise<PatchesCollection> {
    const numbers: number[] = []

    if (this.fsMock[this.getVersionPath(version)] === undefined) {
      throw new Error(`version ${version} doesn't exist`)
    }

    if (this.fsMock[this.getVersionPath(version)][Storage.patchesDir] === undefined) {
      throw new Error(`patches path not found for version ${version}`)
    }

    const patchesStore = this.fsMock[this.getVersionPath(version)][Storage.patchesDir]

    try {

      for (const entry of Object.keys(patchesStore)) {

        const match = basename(entry).match(/^(\d+)\.patch$/)

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

  isDir(path: string): boolean {
    return (typeof this.resolvePath(path) === 'object')
  }

  exists(path: string): boolean {
    try {
      this.resolvePath(path)
      return true
    } catch (error) {
      return false
    }
  }

}
