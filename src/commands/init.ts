import {Command, flags} from '@oclif/command'

import { VersionData } from '../services/version-data'
import runConfig from '../services/run-config'
import vdc from '../services/vdc';

export default class Init extends Command {
  static description = 'initialize a swagman project in the current directory'

  static examples = [
    '$ swagman init',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    'vdc-host': flags.string({description: 'vdc host'})
  }

  async run() {
    const {flags} = this.parse(Init)
    runConfig.debug = flags.debug

    if (flags['vdc-host'] !== undefined) {
      vdc.host = flags['vdc-host']
    }

    const versionData = new VersionData(flags.version)
    await versionData.init()
  }
}
