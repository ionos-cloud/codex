import { Args } from '@oclif/core'
import { S3 } from '../storage/s3'
import BaseCommand from '../base/base-command'
import ui from '../services/ui'

export default class SetUrl extends BaseCommand {
  static description = 'update the API spec URL in api-config.json'

  static examples = [
    '$ codex set-url https://api.example.com/swagger.json',
  ]

  static flags = { ...BaseCommand.flags }

  static args = {
    url: Args.string({
      required: true,
      description: 'new API spec URL',
    })
  }

  async run() {
    const storage = new S3()
    const apiConfig = await storage.getApiConfig()
    const oldUrl = apiConfig.specUrl

    apiConfig.specUrl = this.args.url
    await storage.writeApiConfig(apiConfig)

    ui.info(`spec URL updated: ${oldUrl} → ${this.args.url}`)
  }
}
