import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import ui from '../services/ui'
import BaseCommand from '../base/base-command'
import state, { Mode } from '../services/state'

export default class Update extends BaseCommand {
  static description = 'update baseline from vdc'
  static EXIT_CODE_ON_UPDATES = 2

  static flags = {
    ...BaseCommand.flags,
    check: flags.boolean({
      char: 'c',
      description: 'check if there\'s an update without actually performing the update',
      default: false
    }),
    yes: flags.boolean({
      char: 'y',
      description: 'answer yes to all questions; useful in CI automation',
      default: false
    }),
    output: flags.string({
      char: 'o',
      required: true
    })
  }

  async run() {
    const codex = new Codex()
    await codex.load()

    const update = await codex.updateCheck()
    if (update === undefined) {
      ui.info('no upstream api spec updates found')
      process.exit()
    }

    ui.warning('updates found in upstream api spec')

    if (state.mode === Mode.EDIT) {
      throw new Error('you are currently in edit mode and cannot update the baseline')
    }

    codex.createNewUpstreamUpdate(update?.patch, this.flags.output)

    ui.info(`upstream update saved to ${this.flags.output}`)

    if (this.flags.check) {
      process.exit(Update.EXIT_CODE_ON_UPDATES)
    }

    ui.info('performing baseline update')
    await codex.updateBaseline(update?.content)

    ui.info('baseline updated successfully')
  }

}
