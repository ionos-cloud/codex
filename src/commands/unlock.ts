import {Command, flags} from '@oclif/command'

import runConfig from '../services/run-config'
import * as locking from '../services/locking'
import * as auth from '../services/auth'
import config from '../services/config'
import ui from '../services/ui'

export default class Unlock extends Command {
  static description = 'forcefully release the lock'

  static examples = [ '$ codex unlock' ]

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false}),
  }

  protected async catch(err: any) {
    ui.error(err.message)
    this.exit(1)
  }

  async run() {
    const {flags} = this.parse(Unlock)
    runConfig.debug = flags.debug

    config.check()
    config.load()

    await auth.check()
    await locking.unlock()
  }
}
