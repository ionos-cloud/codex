import {Command, flags} from '@oclif/command'

import { VersionData } from '../services/version-data'
import runConfig from '../services/run-config'
import * as vdc from '../services/vdc'
import * as json from '../services/json'
import ui from '../services/ui'
import * as diff from 'diff'
import * as swagger from '../services/swagger'

export default class Update extends Command {
  static description = 'update baseline from vdc'

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({
      char: 'v',
      default: VersionData.defaultVersion,
      description: 'swagger version to work on'
    }),
    debug: flags.boolean({char: 'd', default: false, description: 'show debug information'}),
    check: flags.boolean({
      char: 'c',
      description: 'check if there\'s an update without actually performing the update',
      default: false
    }),
    yes: flags.boolean({
      char: 'y',
      description: 'answer yes to all questions; useful in CI automation',
      default: false
    })
  }

  async run() {
    const {flags} = this.parse(Update)
    runConfig.debug = flags.debug
    const versionData = new VersionData(flags.version)
    await versionData.load()


  }
}
