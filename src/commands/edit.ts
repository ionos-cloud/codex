import { flags } from '@oclif/command'
import { Codex } from '../services/codex'
import ui from '../services/ui'
import * as fs from 'fs'
import chalk from 'chalk'
import { PatchError } from '../exceptions/patch-error'

import * as locking from '../services/locking'
import * as auth from '../services/auth'
import BaseCommand from '../base/base-command'
import state, { Mode, Status } from '../services/state'

export default class Edit extends BaseCommand {
  static description = 'edit the swagger file after applying all patches or edit a specific patch'

  static flags = {
    ...BaseCommand.flags,
    patch: flags.integer({char: 'p', required: false, default: 0}),
    output: flags.string({char: 'o', required: false}),
    abort: flags.boolean({char: 'a', default: false})
  }

  async run() {

    /* compile up to the given patch and mark it as edit */
    const codex = new Codex()
    await codex.load()

    await auth.check()

    if (this.flags.abort) {
      if (state.mode !== Mode.EDIT) {
        throw new Error('no edit session found; nothing to abort')
      }

      const patchBeingEdited = state.data.patch
      const file = state.data.file

      ui.info(`aborting edit session for patch ${patchBeingEdited}`)
      ui.warning(`file ${file} will be erased`)

      const { Toggle } = require('enquirer')

      const prompt = new Toggle({
        message: 'Are you sure you want to abort the current edit session?',
        enabled: 'Yes',
        disabled: 'No'
      });

      const answer = await prompt.run()

      if (answer) {
        await locking.unlock()
        ui.warning(`removing file ${file}`)
        fs.unlinkSync(file)
        state.setIdle().save()
      } else {
        ui.info('bailing out')
      }
      return
    }

    if (state.mode === Mode.EDIT) {
      throw new Error(`you are already editing patch ${state.data.patch}`)
    }

    const maxPatchLevel = codex.getMaxPatchLevel()
    if (this.flags.patch > maxPatchLevel) {
      throw new Error(`patch ${this.flags.patch} doesn't exist; maximum patch level is ${maxPatchLevel}`)
    }

    let patchToEdit
    let createNew = false
    const versionPatchLevel = codex.getVersionPatchLevel()
    if (this.flags.patch === 0) {
      if (versionPatchLevel > 0) {
        if (versionPatchLevel ===  maxPatchLevel) {
          createNew = true
          patchToEdit = maxPatchLevel + 1
        } else {
          patchToEdit = maxPatchLevel
        }
      } else {
        patchToEdit = 1
        createNew = true
      }
    } else {
      patchToEdit = this.flags.patch
      if (patchToEdit <= versionPatchLevel) {
        throw new Error(`cannot edit a change (patch) that was already included in the baseline; baseline patch level is ${versionPatchLevel}`)
      }
    }

    const output = this.flags.output || 'swagger.json'
    if (fs.existsSync(output)) {
      throw new Error(`file ${output} already exists; please remove it first`)
    }

    await locking.lock()

    let compiled = ''
    try {
      compiled = await codex.compile(createNew ? maxPatchLevel : patchToEdit)
    } catch (error) {
      if (error instanceof PatchError) {
        fs.writeFileSync(output, compiled)
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

    fs.writeFileSync(output, compiled)
    state.set({
      mode: Mode.EDIT,
      status: Status.OK,
      data: {
        patch: patchToEdit,
        file: output
      }
    }).save()
    ui.info(`baseline with all patches applied saved as ${chalk.blueBright(output)}; run '${chalk.yellowBright('codex commit')}' when you're done`)
    ui.info(`changes will be saved in patch number ${patchToEdit}`)

  }
}
