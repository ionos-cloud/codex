import * as YAML from 'yaml'

export const DEFAULT_INDENT = 4

export default {
  marshal: function (object: any, indent: number = DEFAULT_INDENT): string {
    return YAML.stringify(object, {indent})
  },
  unmarshal: function (content: string): any {
    return YAML.parse(content)
  }
}
