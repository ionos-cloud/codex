import {Command, flags} from '@oclif/command'
import * as json from '../services/json'
import ui from '../services/ui'

export default class Diff extends Command {
  static description = 'compute a diff between two json files, normalizing them first'

  static flags = {
    help: flags.help({char: 'h'}),
  }

  static args = [
    {
      name: 'file1',
      required: true,
      description: 'first file'
    },
    {
      name: 'file2',
      required: true,
      description: 'second file'
    }
  ]

  protected async catch(err: any) {
    ui.error(err.message)
  }

  async run() {
    const {args} = this.parse(Diff)
    process.stdout.write(await json.computePatch(args.file1, args.file2))
  }
}
