import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import ui from '../services/ui'
import BaseCommand from '../base/base-command'

export default class Patch extends BaseCommand {
  static description = 'listing patches or editing their description'

  static flags = {
    ...BaseCommand.flags,
    version: flags.integer({char: 'v', default: Codex.defaultVersion}),
    message: flags.string({char: 'm', required: false}),
    number: flags.integer({
      char: 'n',
      required: false,
      description: 'patch to set message for; defaults to last patch',
      dependsOn: [ 'message' ]
    }),
    list: flags.boolean({char: 'l', required: false, exclusive: ['message']})
  }

  async run() {
    const codex = new Codex(this.flags.version)
    await codex.load()

    if (this.flags.message) {

      const numberOfPatches = codex.getNumberOfPatches()
      if (numberOfPatches === 0) {
        throw new Error('there are no patches to work on')
      }

      const patchNumber = this.flags.number || numberOfPatches
      if (patchNumber > numberOfPatches) {
        throw new Error(`patch number ${patchNumber} doesn't exist; there are ${numberOfPatches} total patches`)
      }

      ui.info('saving patch description')
      codex.describePatch(patchNumber, this.flags.message)

    }

    if (this.flags.list) {
      if (codex.numberOfPatches === 0) {
        ui.info('there are no patches')
      } else {
        let i = 1
        for (const description of await codex.listPatches()) {
          ui.info(`[ ${i++} ] - ${description}`)
        }
      }
    }
  }

}
