import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import ui from '../services/ui'
import vdc from '../services/vdc'
import BaseCommand from '../base/base-command'
import state, { Mode } from '../services/state'

export default class Update extends BaseCommand {
  static description = 'update baseline from vdc'
  static EXIT_CODE_ON_UPDATES = 2

  static flags = {
    ...BaseCommand.flags,
    version: flags.integer({
      char: 'v',
      default: Codex.defaultVersion,
      description: 'swagger version to work on'
    }),
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
    }),
    'vdc-host': flags.string({description: 'vdc host'})
  }

  async run() {
    const codex = new Codex(this.flags.version)
    await codex.load()

    if (this.flags['vdc-host'] !== undefined) {
      vdc.host = this.flags['vdc-host']
    }

    const update = await codex.updateCheck()
    if (update === undefined) {
      ui.info('no VDC upstream updates found')
      process.exit()
    }

    ui.warning('updates found in VDC swagger')

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
