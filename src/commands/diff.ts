import * as json from '../services/json'
// import BaseCommand from '../base/base-command'
import ui from '../services/ui'
import { Command, flags } from '@oclif/command'
import runConfig from '../services/run-config'
import { jsonRead } from '../services/json'
import YAML from 'yaml'

export default class Diff extends Command {
  static description = 'compute a diff between two json files, normalizing them first'
  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false, description: 'show debug information'}),
    semantic: flags.boolean({char: 's', default: false, description: 'perform a swagger semantic diff'}),
    yaml: flags.boolean({char: 'y', default: false, description: 'yaml', dependsOn: ['semantic']}),
    ignore: flags.string({char: 'i', multiple: true, description: 'ignore node', dependsOn: ['semantic']})
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
    const {flags, args} = this.parse(this.ctor)
    runConfig.debug = flags.debug
    if (flags.semantic) {
      const diff = json.semanticDiff(await jsonRead(args.file1), await jsonRead(args.file2), flags.ignore)
      if (flags.yaml) {
        ui.print(YAML.stringify(diff))
      } else {
        ui.print(diff)
      }
    } else {
      ui.printPatch(await json.computePatch(args.file1, args.file2))
    }
  }
}
