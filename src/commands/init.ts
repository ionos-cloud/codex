import { Codex } from '../services/codex'
import BaseCommand from '../base/base-command'
import { flags } from '@oclif/command'
import renderers from '../renderers'
import ui from '../services/ui'
import config from '../services/config'

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
    ui.warning(`bucket ${config.get('s3.bucket')} will be reset`)

    const { Toggle } = require('enquirer')

    const prompt = new Toggle({
      message: `Are you sure you want to init the current bucket (${config.get('s3.bucket')})?`,
      enabled: 'Yes',
      disabled: 'No'
    });

    const answer = await prompt.run()

    if (answer) {
      const codex = new Codex()
      await codex.init({
        specUrl: this.args.url,
        format: this.flags.format
      })
    } else {
      ui.info('bailing out')
    }
  }
}
