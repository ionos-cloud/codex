import {Command, flags} from '@oclif/command'
import * as json from '../services/json'

export default class Normalize extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    indent: flags.integer({char: 'i', default: 2})
  }

  static args = [{name: 'file', required: true, description: 'file to normalize'}]

  async run() {
    const {args, flags} = this.parse(Normalize)
    process.stdout.write(await json.normalize(args.file, flags.indent))
  }
}
