import { flags } from '@oclif/command'

import runConfig from '../services/run-config'
import * as locking from '../services/locking'
import * as auth from '../services/auth'
import config from '../services/config'
import BaseCommand from '../base/base-command'

export default class Unlock extends BaseCommand {
  static description = 'forcefully release the lock'

  static examples = [ '$ codex unlock' ]

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false}),
  }

  async run() {
    const {flags} = this.parse(Unlock)
    runConfig.debug = flags.debug

    await auth.check()
    await locking.unlock()
  }
}
