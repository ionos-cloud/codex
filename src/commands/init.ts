import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import vdc from '../services/vdc'
import BaseCommand from '../base/base-command'

export default class Init extends BaseCommand {
  static description = 'initialize a codex project in the current directory'

  static examples = [
    '$ codex init',
  ]

  static flags = {
    ...BaseCommand.flags,
    version: flags.integer({char: 'v', default: Codex.defaultVersion}),
    'vdc-host': flags.string({description: 'vdc host'})
  }

  async run() {

    if (this.flags['vdc-host'] !== undefined) {
      vdc.host = this.flags['vdc-host']
    }

    const codex = new Codex(this.flags.version)
    await codex.init()

  }
}
