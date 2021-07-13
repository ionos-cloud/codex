import { Codex } from '../services/codex'
import BaseCommand from '../base/base-command'

export default class Init extends BaseCommand {
  static description = 'initialize a codex project in S3'

  static examples = [
    '$ codex init https://api.url/spec',
  ]

  static flags = {
    ...BaseCommand.flags
  }

  static args = [{
    name: 'url',
    required: true,
    description: 'api spec url',
    type: 'string'
  }]

  async run() {
    const codex = new Codex()
    await codex.init(this.args.url)
  }
}
