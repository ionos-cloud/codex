import { Codex } from '../services/codex'
import BaseCommand from '../base/base-command'
import { flags } from '@oclif/command'
import renderers from '../renderers'

export default class Init extends BaseCommand {
  static description = 'initialize a codex project in S3'

  static examples = [
    '$ codex init https://api.url/spec',
  ]

  static flags = {
    ...BaseCommand.flags,
    format: flags.string({
      char: 'f', required: true,
      options: Object.keys(renderers),
      description: 'spec format'
    })
  }

  static args = [{
    name: 'url',
    required: true,
    description: 'api spec url',
    type: 'string'
  }]

  async run() {
    const codex = new Codex()
    await codex.init({
      specUrl: this.args.url,
      format: this.flags.format
    })
  }
}
