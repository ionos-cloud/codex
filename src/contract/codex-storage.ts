export type PatchesCollection = {[key: number]: string}

export interface CodexStorage {
  readBaseline(version: number): Promise<string>;
  writeBaseline(version: number, content: string): void;
  readPatch(version: number, patch: number): Promise<string>;
  readPatchDescription(version: number, patch: number): Promise<string>;
  writePatch(version: number, patch: number, content: string): void;
  writePatchDescription(version: number, patch: number, content: string): void;
  removePatch(version: number, patch: number): void;
  removePatchDescription(version: number, patch: number): void;
  fetchPatches(version: number): Promise<PatchesCollection>;
}
