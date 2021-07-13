import { Codex } from '../services/codex'
import BaseCommand from '../base/base-command'

export default class Init extends BaseCommand {
  static description = 'initialize a codex project in S3'

  static examples = [
    '$ codex init',
  ]

  static flags = {
    ...BaseCommand.flags
  }

  async run() {
    const codex = new Codex()
    await codex.init()

  }
}
