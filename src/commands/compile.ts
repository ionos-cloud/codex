import { flags } from '@oclif/command'
import { Codex } from '../services/codex'
import ui from '../services/ui'
import * as fs from 'fs'
import chalk from 'chalk'
import { PatchError } from '../exceptions/patch-error'
import BaseCommand from '../base/base-command'
import state, { Mode, Status } from '../services/state'
import * as locking from '../services/locking'

export default class Compile extends BaseCommand {
  static description = 'compile baseline plus all the patches'

  static flags = {
    ...BaseCommand.flags,
    output: flags.string({char: 'o', required: false})
  }

  async run() {
    const codex = new Codex()
    await codex.load()

    if (state.mode !== Mode.IDLE) {
      throw new Error('you\'re currently in edit mode; commit or abort before compiling')
    }

    const output = this.flags.output || 'swagger.json'

    if (fs.existsSync(output)) {
      throw new Error(`file ${output} already exists; please remove it first`)
    }

    let content = ''
    try {
      content = await codex.compile(codex.getMaxPatchLevel())
    } catch (error) {
      if (error instanceof PatchError) {
        await locking.lock()
        fs.writeFileSync(output, error.content)
        state.set({
          mode: Mode.EDIT,
          status: Status.PATCH_FAILED,
          data: {
            patch: error.patch,
            file: output
          }
        }).save()
        throw new Error(`applying patch ${state.data.patch} failed; please edit ${output} and than run 'codex commit' to fix the patch`)
      } else {
        throw error
      }
    }

    fs.writeFileSync(output, content)
    ui.info(`compiled swagger saved as ${chalk.yellowBright(output)}`)
  }
}
