import config from '../services/config'
import BaseCommand from '../base/base-command'
import * as json from '../services/json'

export default class Config extends BaseCommand {
  static description = 'codex configuration management'

  static examples = [
    '$ codex config',
    '$ codex config foo.bar',
    '$ codex config foo.bar value'
  ]

  static flags = {
    ...BaseCommand.flags
  }

  static args = [{
    name: 'path',
    required: false,
    description: 'configuration setting path e.g. \'auth.username\'',
    type: 'string'
  }, {
    name: 'value',
    required: false,
    description: 'configuration value'
  }]

  async run() {

    if (this.args.path === undefined) {
      /* display the whole config */
      this.log(json.serialize(config.data))
    } else if (this.args.value === undefined) {
      /* display the value */
      this.log(config.get(this.args.path))
    } else {
      /* set the value */
      config.set(this.args.path, this.args.value)
      config.save()
    }
  }
}
