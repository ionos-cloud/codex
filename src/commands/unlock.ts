import * as locking from '../services/locking'
import * as auth from '../services/auth'
import BaseCommand from '../base/base-command'

export default class Unlock extends BaseCommand {
  static description = 'forcefully release the lock'

  static examples = [ '$ codex unlock' ]

  static flags = BaseCommand.flags

  async run() {
    await auth.check()
    await locking.unlock()
  }
}
