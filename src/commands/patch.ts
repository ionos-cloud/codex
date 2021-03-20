import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import ui from '../services/ui'
import BaseCommand from '../base/base-command'
import * as locking from '../services/locking'

export default class Patch extends BaseCommand {
  static description = 'listing patches or editing their description'

  locked = false

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
    list: flags.boolean({char: 'l', required: false, exclusive: ['message']}),
    rm: flags.integer({char: 'r', required: false, exclusive: ['message', 'list']})
  }

  async run() {
    const codex = new Codex(this.flags.version)
    await codex.load()

    if (this.flags.message) {

      const maxPatchLevel = codex.getMaxPatchLevel()
      if (maxPatchLevel === 0) {
        throw new Error('there are no patches to work on')
      }

      const patchNumber = this.flags.number || maxPatchLevel
      if (patchNumber > maxPatchLevel) {
        throw new Error(`patch number ${patchNumber} doesn't exist; max patch level is ${maxPatchLevel}`)
      }

      ui.info('saving patch description')
      codex.describePatch(patchNumber, this.flags.message)

    }

    if (this.flags.list) {
      if (Object.keys(codex.patches).length === 0) {
        ui.info('there are no patches')
      } else {
        for (const n of Object.keys(codex.patches).map(v => Number(v))) {
          ui.info(`[ ${n} ] - ${codex.patches[n]}`)
        }
      }
    }

    if (this.flags.rm !== undefined) {
      if (!Object.keys(codex.patches).map(v => Number(v)).includes(this.flags.rm)) {
        throw new Error(`patch ${this.flags.rm} not found`)
      }
      await locking.lock()
      this.locked = true

      ui.warning('removing a patch will BREAK the chain of patches')
      ui.warning('you will have to manually fix the list of patches to be able to compile the codex')
      const { Toggle } = require('enquirer')

      const prompt = new Toggle({
        message: `Are you sure you want to remove patch number ${this.flags.rm}?`,
        enabled: 'Yes',
        disabled: 'No'
      });

      const answer = await prompt.run()

      if (answer) {
        await codex.removePatch(this.flags.rm)
      }
    }
  }

  protected async finally(_: Error | undefined): Promise<any> {
    if (this.locked) {
      await locking.unlock()
    }
    return super.finally(_);
  }

}
