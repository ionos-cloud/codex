import { flags } from '@oclif/command'

import { Codex } from '../services/codex'
import ui from '../services/ui'
import chalk from 'chalk'
import BaseCommand from '../base/base-command'
import state, { Mode, Status as StateStatus } from '../services/state'

export default class Status extends BaseCommand {
  static description = 'display status information'

  static examples = [ '$ codex status' ]

  static flags = {
    ...BaseCommand.flags,
    version: flags.integer({char: 'v', default: Codex.defaultVersion}),
    reset: flags.boolean({char: 'r', default: false})
  }

  async run() {
    const codex = new Codex(this.flags.version)
    await codex.load()

    switch (state.mode) {
      case Mode.EDIT: {
        if (state.status === StateStatus.PATCH_FAILED) {
          ui.info(`editing ${chalk.redBright('FAILED')} patch number ${chalk.redBright(state.data.patch)} in file ${chalk.yellowBright(state.data.file)}`)
        } else {
          ui.info(`editing patch number ${chalk.yellowBright(state.data.patch)} in file ${chalk.yellowBright(state.data.file)}`)
        }

        if (this.flags.reset) {
          const { Toggle } = require('enquirer')
          const prompt = new Toggle({
            message: 'Are you sure you want to reset the internal state to idle?',
            enabled: 'Yes',
            disabled: 'No'
          })
          if (await prompt.run()) {
            ui.info('setting internal state to idle')
            state.setIdle().save()
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
