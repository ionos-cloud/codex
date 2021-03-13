import { Command, flags } from '@oclif/command'

import { Mode, VersionData, Status as VersionStatus } from '../services/version-data'
import runConfig from '../services/run-config'
import ui from '../services/ui'
import chalk from 'chalk'

export default class Status extends Command {
  static description = 'display status information'

  static examples = [ '$ swagman status' ]

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    reset: flags.boolean({char: 'r', default: false})
  }

  async run() {
    const {flags} = this.parse(Status)
    runConfig.debug = flags.debug
    const versionData = new VersionData(flags.version)
    versionData.load()

    switch (versionData.state.mode) {
      case Mode.EDIT: {
        if (versionData.state.status === VersionStatus.PATCH_FAILED) {
          ui.info(`editing ${chalk.redBright('FAILED')} patch number ${chalk.redBright(versionData.state.data.patch)} in file ${chalk.yellowBright(versionData.state.data.file)}`)
        } else {
          ui.info(`editing patch number ${chalk.yellowBright(versionData.state.data.patch)} in file ${chalk.yellowBright(versionData.state.data.file)}`)
        }

        if (flags.reset) {
          const { Confirm } = require('enquirer')
          const prompt = new Confirm({
            name: 'question',
            message: 'Are you sure you want to reset the internal state to idle?'
          })
          if (prompt.run()) {
            ui.info('setting internal state to idle')
            versionData.setIdle().saveState()
          }
        }
        break
      }
      default: {
        ui.info('up to date; nothing to commit')
      }
    }

  }
}