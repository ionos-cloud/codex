import {Command, flags} from '@oclif/command'
import * as json from '../services/json'

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

  async run() {
    const {args} = this.parse(Diff)
    process.stdout.write(await json.computePatch(args.file1, args.file2))
  }
}
