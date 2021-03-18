import { Command, flags } from '@oclif/command'

import { Mode, VersionData, Status as VersionStatus } from '../services/version-data'
import runConfig from '../services/run-config'
import ui from '../services/ui'
import chalk from 'chalk'
import config from '../services/config'

export default class Status extends Command {
  static description = 'display status information'

  static examples = [ '$ codex status' ]

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    reset: flags.boolean({char: 'r', default: false})
  }

  protected async catch(err: any) {
    ui.error(err.message)
    this.exit(1)
  }

  async run() {
    const {flags} = this.parse(Status)
    runConfig.debug = flags.debug

    config.check()
    config.load()

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
          const { Toggle } = require('enquirer')
          const prompt = new Toggle({
            message: 'Are you sure you want to reset the internal state to idle?',
            enabled: 'Yes',
            disabled: 'No'
          })
          if (await prompt.run()) {
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
