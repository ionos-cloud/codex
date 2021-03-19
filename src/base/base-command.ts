import { Command, flags } from '@oclif/command'
import config from '../services/config'
import runConfig from '../services/run-config'
import ui from '../services/ui'

export default abstract class BaseCommand extends Command {
  flags: any
  args: Record<string, any> = {}

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false}),
  }

  static args: any[] = []

  async init() {
    const {flags, args} = this.parse(this.ctor)
    this.flags = flags
    this.args = args
    runConfig.debug = this.flags.debug

    config.load(this.config.configDir)
  }

  async catch(error: any) {
    ui.error(error)
    ui.debug(error.stack)
    this.exit(1)
  }
}
