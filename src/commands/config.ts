import config from '../services/config'
import BaseCommand from '../base/base-command'
import ui from '../services/ui'
import state, { Mode } from '../services/state'
import renderers from '../renderers'

export default class Config extends BaseCommand {

  skipConfigValidation = true

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
      this.log(renderers.json.marshal(config.data))
    } else if (this.args.value === undefined) {
      /* display the value */
      this.log(config.get(this.args.path))
    } else {
      /* set the value */

      let resetState = false
      if (this.args.path === 's3.bucket') {
        /* state will be reset, warn */
        resetState = true

        if (state.mode !== Mode.IDLE) {
          ui.warning('You\'re currently editing a patch; changing the bucket will result in the state being reset')
          const { Toggle } = require('enquirer')
          const prompt = new Toggle({
            message: 'Are you sure you want to reset the state?',
            enabled: 'Yes',
            disabled: 'No'
          });

          const answer = await prompt.run()

          if (!answer) {
            ui.info('bailing out')
            return
          }
        }
      }

      config.set(this.args.path, this.args.value)
      config.save()

      if (resetState) {
        ui.info('resetting state')
        await state.reset()
      }
    }
  }
}
