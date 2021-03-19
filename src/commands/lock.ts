import * as locking from '../services/locking'
import * as auth from '../services/auth'
import BaseCommand from '../base/base-command'

export default class Lock extends BaseCommand {
  static description = 'acquire the global codex lock'

  static examples = [ '$ codex lock' ]

  static flags = BaseCommand.flags

  async run() {
    await auth.check()
    await locking.lock()
  }
}
