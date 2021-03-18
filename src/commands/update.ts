import { Command, flags } from '@oclif/command'

import { Mode, VersionData } from '../services/version-data'
import runConfig from '../services/run-config'
import ui from '../services/ui'
import vdc from '../services/vdc'
import * as fs from 'fs'
import config from '../services/config'

export default class Update extends Command {
  static description = 'update baseline from vdc'
  static EXIT_CODE_ON_UPDATES = 2

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
    }),
    output: flags.string({
      char: 'o',
      required: false
    }),
    'vdc-host': flags.string({description: 'vdc host'})
  }

  async run() {
    const {flags} = this.parse(Update)
    runConfig.debug = flags.debug

    config.load()

    const versionData = new VersionData(flags.version)
    await versionData.load()

    if (flags['vdc-host'] !== undefined) {
      vdc.host = flags['vdc-host']
    }

    const update = await versionData.updateCheck()
    if (update === undefined) {
      ui.info('no VDC upstream updates found')
      this.exit()
    }

    ui.warning('updates found in VDC swagger')

    if (versionData.state.mode === Mode.EDIT) {
      throw new Error('you are currently in edit mode and cannot update the baseline')
    }

    let updateFile = ''
    if (flags.output === undefined) {
      updateFile = versionData.createNewUpstreamUpdate(update?.patch)
    } else {
      updateFile = flags.output
      fs.writeFileSync(flags.output, update?.patch)
    }

    ui.info(`upstream update saved to ${updateFile}`)

    if (flags.check) {
      this.exit(Update.EXIT_CODE_ON_UPDATES)
    }

    ui.info('performing baseline update')
    versionData.updateBaseline(update?.content)

    ui.info('baseline updated successfully')
  }

  protected async catch(err: any) {
    ui.error(err.message)
  }
}
