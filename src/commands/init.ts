import {Command, flags} from '@oclif/command'

import { VersionData } from '../services/version-data'
import runConfig from '../services/run-config'

export default class Init extends Command {
  static description = 'initialize a swagman project in the current directory'

  static examples = [
    '$ swagman init',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false})
  }

  async run() {
    const {flags} = this.parse(Init)
    runConfig.debug = flags.debug
    const versionData = new VersionData(flags.version)
    await versionData.init()
  }
}
