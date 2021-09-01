import yamlRenderer from './yaml-renderer'
import jsonRenderer from './json-renderer'

export const DEFAULT_RENDERER = 'json'

export default {
  yaml: yamlRenderer,
  json: jsonRenderer
}
