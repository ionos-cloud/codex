import { flags } from '@oclif/command'
import { Codex } from '../services/codex'
import ui from '../services/ui'
import * as fs from 'fs'
import { PatchError } from '../exceptions/patch-error'
import * as auth from '../services/auth'
import * as locking from '../services/locking'
import * as swagger from '../services/swagger'
import BaseCommand from '../base/base-command'
import state, { Mode } from '../services/state'

export default class Commit extends BaseCommand {
  static description = 'commit changes into the patch being edited'

  static flags = {
    ...BaseCommand.flags,
    message: flags.string({char: 'm', required: false})
  }

  async run() {

    if (state.mode !== Mode.EDIT) {
      throw new Error(`nothing to commit; run 'codex edit --version ${this.flags.version} first`)
    }

    const patchBeingEdited = state.data.patch
    const version = state.version

    if (patchBeingEdited === 0) {
      throw new Error('invalid state: patch being edited is patch number 0')
    }

    if (version === undefined) {
      throw new Error('invalid state: unknown version')
    }

    const workFile = state.data.file
    if (!fs.existsSync(workFile)) {
      throw new Error(`work file ${workFile} not found!`)
    }

    const codex = new Codex(version)
    await codex.load()

    await auth.check()

    let prevContent = ''
    try {
      prevContent = await codex.compile(state.data.patch - 1)
    } catch (error) {
      if (error instanceof PatchError) {
        const failedPatch = error.patch
        ui.error(`something went wrong with patch ${failedPatch}`)
        ui.error(`please run 'codex edit --abort' followed by 'codex edit --patch ${failedPatch} -v ${version}' to fix it `)
        throw new Error('could not commit changes')
      } else {
        throw error
      }
    }

    /* check patch level in the workFile */
    swagger.fixPatchLevel(workFile, patchBeingEdited)

    ui.info(`saving patch ${patchBeingEdited}`)
    await codex.createPatch(patchBeingEdited, prevContent, fs.readFileSync(workFile).toString())

    const desc = this.flags.message || '<no description>'
    ui.info('saving patch description')
    await codex.describePatch(patchBeingEdited, desc)
    state.setIdle().save()

    try {
      await locking.unlock()
    } catch (error) {
      ui.warning('an error occurred while trying to release the lock; ignoring')
    }

    ui.info(`removing work file ${workFile}`)
    fs.unlinkSync(workFile)

  }
}
