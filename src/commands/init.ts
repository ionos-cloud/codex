import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import vdc from '../services/api'
import BaseCommand from '../base/base-command'

export default class Init extends BaseCommand {
  static description = 'initialize a codex project in S3'

  static examples = [
    '$ codex init',
  ]

  static flags = {
    ...BaseCommand.flags,
    version: flags.integer({char: 'v', default: Codex.defaultVersion})
  }

  async run() {
    const codex = new Codex(this.flags.version)
    await codex.init()

  }
}
