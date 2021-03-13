export class PatchError extends Error {
  patch: number
  content: string
  constructor(message: string, patch: number, content: string) {
    super(message);
    this.patch = patch
    this.content = content
  }
}
