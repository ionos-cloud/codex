import * as json from '../services/utils'
import { readFile } from '../services/utils'
// import BaseCommand from '../base/base-command'
import ui from '../services/ui'
import { Command, flags } from '@oclif/command'
import runConfig from '../services/run-config'
import semanticDiff from '../services/semantic-diff'
import renderers from '../renderers'

export default class Diff extends Command {
  static description = 'compute a diff between two json or yaml files, normalizing them first'
  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false, description: 'show debug information'}),
    semantic: flags.boolean({char: 's', default: false, description: 'perform a swagger semantic diff'}),
    format: flags.string({
      char: 'f', default: 'json', options: Object.keys(renderers),
      description: 'input files format'
    }),
    output: flags.string({
      char: 'o', default: 'yaml', description: 'output format of semantic diff structure',
      options: Object.keys(renderers)
    }),
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

    const inputRenderer = renderers[flags.format as keyof typeof renderers]

    if (flags.semantic) {
      const diff = semanticDiff.diff(await readFile(args.file1, inputRenderer), await readFile(args.file2, inputRenderer), flags.ignore)
      const outputRenderer = renderers[flags.output as keyof typeof renderers]
      ui.print(outputRenderer.marshal(diff))
    } else {
      ui.printPatch(await json.computePatch(args.file1, args.file2, inputRenderer))
    }
  }
}
