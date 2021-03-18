import {Command, flags} from '@oclif/command'

import runConfig from '../services/run-config'
import * as locking from '../services/locking'
import * as auth from '../services/auth'
import config from '../services/config'
import ui from '../services/ui'

export default class Lock extends Command {
  static description = 'acquire the global codex lock'

  static examples = [ '$ codex lock' ]

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false}),
  }

  protected async catch(err: any) {
    ui.error(err.message)
  }

  async run() {
    const {flags} = this.parse(Lock)
    runConfig.debug = flags.debug

    config.check()
    config.load()

    await auth.check()
    await locking.lock()
  }
}
