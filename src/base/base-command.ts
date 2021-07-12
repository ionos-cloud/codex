import { Command, flags } from '@oclif/command'
import config from '../services/config'
import runConfig from '../services/run-config'
import ui from '../services/ui'
import state from '../services/state'

export default abstract class BaseCommand extends Command {
  flags: any
  args: Record<string, any> = {}

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false, description: 'show debug information'}),
    'spec-url': flags.string({description: 'open api spec url'})
  }

  static args: any[] = []

  async init() {
    const {flags, args} = this.parse(this.ctor)
    this.flags = flags
    this.args = args
    runConfig.debug = this.flags.debug

    config.load(this.config.configDir)
    state.load()

    /* override spec url */
    if (this.flags['spec-url'] !== undefined) {
      config.set('specUrl', this.flags['spec-url'])
    }
  }

  async catch(error: any) {
    ui.error(error)
    ui.debug(error.stack)
    this.exit(1)
  }
}
