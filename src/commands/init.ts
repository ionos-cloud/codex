import {Command, flags} from '@oclif/command'

import { VersionData } from '../services/version-data'
import runConfig from '../services/run-config'
import vdc from '../services/vdc'
import config from '../services/config'
import BaseCommand from '../base/base-command'

export default class Init extends BaseCommand {
  static description = 'initialize a codex project in the current directory'

  static examples = [
    '$ codex init',
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
    config.init()

  }
}
