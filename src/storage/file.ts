import { CodexStorage } from '../contract/codex-storage'

export class File implements CodexStorage {
  countPatches(version: number): Promise<number> {
    throw new Error('file storage not implemented')
  }

  readBaseline(version: number): Promise<string> {
    throw new Error('file storage not implemented')
  }

  readPatch(version: number, patch: number): Promise<string> {
    throw new Error('file storage not implemented')
  }

  writeBaseline(version: number, content: string): void {
    throw new Error('file storage not implemented')
  }

  writePatch(version: number, patch: number, content: string): void {
    throw new Error('file storage not implemented')
  }

  readPatchDescription(version: number, patch: number): Promise<string> {
    throw new Error('file storage not implemented')
  }

  writePatchDescription(version: number, patch: number, content: string): void {
    throw new Error('file storage not implemented')
  }

}
