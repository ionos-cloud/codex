import {Command} from '@oclif/core'

export default class Version extends Command {
  static description = 'Print the version of codex'

  async run() {
    this.log(`codex ${this.config.version}`)
  }
}
