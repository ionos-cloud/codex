import { Command, flags } from '@oclif/command'
import runConfig from '../services/run-config'
import { Mode, VersionData } from '../services/version-data'
import ui from '../services/ui'
import * as fs from 'fs'
import { PatchError } from '../exceptions/patch-error'
import config from '../services/config'
import * as auth from '../services/auth'
import * as locking from '../services/locking'
import * as swagger from '../services/swagger'
import BaseCommand from '../base/base-command'

export default class Commit extends BaseCommand {
  static description = 'commit changes into the patch being edited'

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', required: false, default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    message: flags.string({char: 'm', required: false})
  }

  async run() {
    const {flags} = this.parse(Commit)

    runConfig.debug = flags.debug

    const versionData = new VersionData(flags.version)
    versionData.load()

    if (versionData.state.mode !== Mode.EDIT) {
      throw new Error(`nothing to commit; run 'codex edit --version ${flags.version} first`)
    }

    const patchBeingEdited = versionData.state.data.patch
    if (patchBeingEdited === 0) {
      throw new Error('invalid state: patch being edited is patch number 0')
    }

    const workFile = versionData.state.data.file
    if (!fs.existsSync(workFile)) {
      throw new Error(`work file ${workFile} not found!`)
    }

    await auth.check()

    let prevContent = ''
    try {
      prevContent = versionData.compile(versionData.state.data.patch - 1)
    } catch (error) {
      if (error instanceof PatchError) {
        const failedPatch = error.patch
        ui.error(`something went wrong with patch ${failedPatch}`)
        ui.error(`please run 'codex edit --abort' followed by 'codex edit --patch ${failedPatch}' to fix it `)
        throw new Error('could not commit changes')
      } else {
        throw error
      }
    }

    /* should we unlock later? */
    try {
      await locking.unlock()
    } catch (error) {
      ui.warning('an error occurred while trying to release the lock; continuing')
    }

    /* check patch level in the workFile */
    swagger.fixPatchLevel(workFile, patchBeingEdited)

    ui.info(`saving patch ${patchBeingEdited}`)
    versionData.createPatch(patchBeingEdited, prevContent, fs.readFileSync(workFile).toString())

    if (flags.message !== undefined) {
      ui.info('saving patch description')
      versionData.describePatch(patchBeingEdited, flags.message)
    }
    versionData.setIdle().saveState()

    ui.info(`removing work file ${workFile}`)
    fs.unlinkSync(workFile)

  }
}
