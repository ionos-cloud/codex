export type PatchesCollection = {[key: number]: string}

export interface ApiConfig {
  specUrl: string;
}

export interface CodexStorage {
  readBaseline(): Promise<string>;
  writeBaseline(content: string): void;
  readPatch(patch: number): Promise<string>;
  readPatchDescription(patch: number): Promise<string>;
  writePatch(patch: number, content: string): void;
  writePatchDescription(patch: number, content: string): void;
  removePatch(patch: number): void;
  removePatchDescription(patch: number): void;
  fetchPatches(): Promise<PatchesCollection>;
  getApiConfig(): Promise<ApiConfig>;
  writeApiConfig(apiConfig: ApiConfig): void;
}
