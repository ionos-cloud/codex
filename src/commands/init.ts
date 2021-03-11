import {Command, flags} from '@oclif/command'

import configService from '../services/config'

export default class Init extends Command {
  static description = 'initialize a swagman project in the current directory'

  static examples = [
    '$ swagman init',
  ]

  static flags = {
    help: flags.help({char: 'h'}),
  }

  async run() {
    this.parse(Init)
    configService.init()
  }
}
