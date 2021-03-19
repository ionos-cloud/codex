import { flags} from '@oclif/command'

import runConfig from '../services/run-config'
import * as locking from '../services/locking'
import * as auth from '../services/auth'
import BaseCommand from '../base/base-command'

export default class Lock extends BaseCommand {
  static description = 'acquire the global codex lock'

  static examples = [ '$ codex lock' ]

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false}),
  }

  async run() {
    const {flags} = this.parse(Lock)
    runConfig.debug = flags.debug

    await auth.check()
    await locking.lock()
  }
}
