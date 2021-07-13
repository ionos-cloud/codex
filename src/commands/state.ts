import { flags } from '@oclif/command'

import BaseCommand from '../base/base-command'
import state from '../services/state'
import ui from '../services/ui'

export default class State extends BaseCommand {
  static description = 'inspect or reset the state'

  static flags = {
    ...BaseCommand.flags,
    reset: flags.boolean({default: false, required: false})
  }

  async run() {

    if (this.flags.reset) {
      ui.info('resetting state')
      await state.reset()
    } else {
      ui.print(JSON.stringify(state.get(), null, 2))
    }

  }
}
