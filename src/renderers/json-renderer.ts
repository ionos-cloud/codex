export const DEFAULT_INDENT = 2

export default {
  marshal: function (object: any, indent: number = DEFAULT_INDENT): string {
    return JSON.stringify(object, null, indent)
  },
  unmarshal: function (content: string): any {
    return JSON.parse(content)
  }
}
