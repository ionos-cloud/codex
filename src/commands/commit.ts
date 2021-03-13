import { Command, flags } from '@oclif/command'
import runConfig from '../services/run-config'
import { Mode, Status, VersionData } from '../services/version-data'
import ui from '../services/ui'
import * as fs from 'fs'
import { PatchError } from '../exceptions/patch-error'

export default class Commit extends Command {
  static description = 'commit changes into the patch being edited'

  static flags = {
    help: flags.help({char: 'h'}),
    version: flags.integer({char: 'v', required: false, default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
  }

  protected async catch(err: any) {
    ui.error(err.message)
  }

  async run() {
    const {flags} = this.parse(Commit)

    runConfig.debug = flags.debug

    const versionData = new VersionData(flags.version)
    versionData.load()

    if (versionData.state.mode !== Mode.EDIT) {
      throw new Error(`nothing to commit; run 'swagman edit --version ${flags.version} first`)
    }

    const patchBeingEdited = versionData.state.data.patch
    if (patchBeingEdited === 0) {
      throw new Error('invalid state: patch being edited is patch number 0')
    }
    const workFile = versionData.state.data.file
    if (!fs.existsSync(workFile)) {
      throw new Error(`work file ${workFile} not found!`)
    }

    let prevContent = ''
    try {
      prevContent = versionData.compile(versionData.state.data.patch - 1)
    } catch (error) {
      if (error instanceof PatchError) {
        const failedPatch = error.patch
        ui.error(`something went wrong with patch ${failedPatch}`)
        ui.error(`please run 'swagman edit --abort' followed by 'swagman edit --patch ${failedPatch}' to fix it `)
        throw new Error('could not commit changes')
      } else {
        throw error
      }
    }

    ui.info(`saving patch ${patchBeingEdited}`)
    versionData.createPatch(patchBeingEdited, prevContent, fs.readFileSync(workFile).toString())
    versionData.setIdle().saveState()

    ui.info(`removing work file ${workFile}`)
    fs.unlinkSync(workFile)
  }
}
