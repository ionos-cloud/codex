import {Command, flags} from '@oclif/command'
import * as json from '../services/utils'
import ui from '../services/ui'
import renderers from '../renderers'

export default class Normalize extends Command {
  static description = 'take a minified json or yaml file a produce an indented version of it'

  static flags = {
    help: flags.help({char: 'h'}),
    indent: flags.integer({char: 'i', default: 2}),
    format: flags.string({char: 'f', default: 'json', options: Object.keys(renderers), description: 'file format'})
  }

  static args = [{name: 'file', required: true, description: 'file to normalizeFile'}]

  protected async catch(err: any) {
    ui.error(err.message)
    this.exit(1)
  }

  async run() {
    const {args, flags} = this.parse(Normalize)
    process.stdout.write(await json.normalizeFile(args.file, renderers[flags.format as keyof typeof renderers], flags.indent))
  }
}
