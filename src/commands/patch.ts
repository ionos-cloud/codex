import {Command, flags} from '@oclif/command'

import { VersionData } from '../services/version-data'
import runConfig from '../services/run-config'
import ui from '../services/ui'

export default class Patch extends Command {
  static description = 'listing patches or editing their description'

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    message: flags.string({char: 'm', required: false}),
    number: flags.integer({
      char: 'n',
      required: false,
      description: 'patch to set message for; defaults to last patch',
      dependsOn: [ 'message' ]
    }),
    list: flags.boolean({char: 'l', required: false, exclusive: ['message']})
  }

  async run() {
    const {flags} = this.parse(Patch)
    runConfig.debug = flags.debug
    const versionData = new VersionData(flags.version)
    await versionData.load()

    if (flags.message) {

      const numberOfPatches = versionData.getNumberOfPatches()
      if (numberOfPatches === 0) {
        throw new Error('there are no patches to work on')
      }

      const patchNumber = flags.number || numberOfPatches
      if (patchNumber > numberOfPatches) {
        throw new Error(`patch number ${patchNumber} doesn't exist; there are ${numberOfPatches} total patches`)
      }

      ui.info('saving patch description')
      versionData.describePatch(patchNumber, flags.message)

    }

    if (flags.list) {
      if (versionData.numberOfPatches === 0) {
        ui.info('there are no patches')
      } else {
        let i = 1
        for (const description of versionData.listPatches()) {
          ui.info(`[ ${i++} ] - ${description}`)
        }
      }
    }
  }
}
