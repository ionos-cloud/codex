import { Command, flags } from '@oclif/command'
import runConfig from '../services/run-config'
import { Mode, Status, VersionData } from '../services/version-data'
import ui from '../services/ui'
import * as fs from 'fs'
import chalk from 'chalk'
import { PatchError } from '../exceptions/patch-error'
import config from '../services/config'

export default class Compile extends Command {
  static description = 'compile baseline plus all the patches'

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', required: false, default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    output: flags.string({char: 'o', required: false})
  }

  protected async catch(err: any) {
    ui.error(err.message)
    this.exit(1)
  }

  async run() {
    const {flags} = this.parse(Compile)

    config.check()
    config.load()

    runConfig.debug = flags.debug

    const versionData = new VersionData(flags.version)
    versionData.load()

    if (versionData.state.mode !== Mode.IDLE) {
      throw new Error('you\'re currently in edit mode; commit or abort before compiling')
    }

    const output = flags.output || `swagger-v${flags.version}.json`

    if (fs.existsSync(output)) {
      throw new Error(`file ${output} already exists; please remove it first`)
    }

    let content = ''
    try {
      content = versionData.compile(versionData.getNumberOfPatches())
    } catch (error) {
      if (error instanceof PatchError) {
        fs.writeFileSync(output, error.content)
        versionData.setState({
          mode: Mode.EDIT,
          status: Status.PATCH_FAILED,
          data: {
            patch: error.patch,
            file: output
          }
        }).saveState()
        throw new Error(`applying patch ${versionData.state.data.patch} failed; please edit ${output} and than run 'codex commit' to fix the patch`)
      } else {
        throw error
      }
    }

    fs.writeFileSync(output, content)
    ui.info(`compiled swagger saved as ${chalk.yellowBright(output)}`)
  }
}
