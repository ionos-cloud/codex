import {Command, flags} from '@oclif/command'
import * as json from '../services/json'
import ui from '../services/ui'

export default class Normalize extends Command {
  static description = 'take a minified json file a produce an indented version of it'

  static flags = {
    help: flags.help({char: 'h'}),
    indent: flags.integer({char: 'i', default: 2})
  }

  static args = [{name: 'file', required: true, description: 'file to normalizeFile'}]

  protected async catch(err: any) {
    ui.error(err.message)
    this.exit(1)
  }

  async run() {
    const {args, flags} = this.parse(Normalize)
    process.stdout.write(await json.normalizeFile(args.file, flags.indent))
  }
}
