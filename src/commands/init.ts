import {Command, flags} from '@oclif/command'

import { VersionData } from '../services/version-data'

export default class Init extends Command {
  static description = 'initialize a swagman project in the current directory'

  static examples = [
    '$ swagman init',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', default: VersionData.defaultVersion})
  }

  async run() {
    const {flags} = this.parse(Init)
    const versionData = new VersionData(flags.version)
    await versionData.init()
  }
}
