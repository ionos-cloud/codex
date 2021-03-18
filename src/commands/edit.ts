import { Command, flags } from '@oclif/command'
import runConfig from '../services/run-config'
import { Mode, Status, VersionData } from '../services/version-data'
import ui from '../services/ui'
import * as fs from 'fs'
import chalk from 'chalk'
import { PatchError } from '../exceptions/patch-error'

import config from '../services/config'
import * as locking from '../services/locking'
import * as auth from '../services/auth'

export default class Edit extends Command {
  static description = 'describe the command here'

  static flags = {
    help: flags.help({char: 'h'}),
    patch: flags.integer({char: 'p', required: false, default: 0}),
    output: flags.string({char: 'o', required: false}),
    version: flags.integer({char: 'v', required: false, default: VersionData.defaultVersion}),
    debug: flags.boolean({char: 'd', default: false}),
    abort: flags.boolean({char: 'a', default: false})
  }

  protected async catch(err: any) {
    ui.error(err.message)
    this.exit(1)
  }

  async run() {
    const {flags} = this.parse(Edit)

    runConfig.debug = flags.debug

    config.check()
    config.load()

    /* compile up to the given patch and mark it as edit */
    const versionData = new VersionData(flags.version)
    versionData.load()

    await auth.check()

    if (flags.abort) {
      if (versionData.state.mode !== Mode.EDIT) {
        throw new Error('no edit session found; nothing to abort')
      }

      const patchBeingEdited = versionData.state.data.patch
      const file = versionData.state.data.file

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
        versionData.setIdle().saveState()
      } else {
        ui.info('bailing out')
      }
      return
    }

    if (versionData.state.mode === Mode.EDIT) {
      throw new Error(`you are already editing patch ${versionData.state.data.patch}`)
    }

    if (flags.patch > versionData.getNumberOfPatches()) {
      throw new Error(`patch ${flags.patch} doesn't exist; there are ${versionData.getNumberOfPatches()} patches in total`)
    }

    let patchToEdit = 0
    let createNew = false
    const versionPatchLevel = versionData.getVersionPatchLevel()
    const numberOfPatches = versionData.getNumberOfPatches()
    if (flags.patch === 0) {
      if (versionPatchLevel > 0) {
        if (versionPatchLevel ===  numberOfPatches) {
          createNew = true
          patchToEdit = numberOfPatches + 1
        } else {
          patchToEdit = versionData.getNumberOfPatches()
        }
      } else {
        patchToEdit = 1
        createNew = true
      }
    } else {
      patchToEdit = flags.patch
      if (patchToEdit <= versionPatchLevel) {
        throw new Error(`cannot edit a change (patch) that was already included in the baseline; baseline patch level is ${versionPatchLevel}`)
      }
    }

    const output = flags.output || `swagger-v${flags.version}.json`
    if (fs.existsSync(output)) {
      throw new Error(`file ${output} already exists; please remove it first`)
    }

    await locking.lock()

    let compiled = ''
    try {
      compiled = versionData.compile(createNew ? versionData.getNumberOfPatches() : patchToEdit)
    } catch (error) {
      if (error instanceof PatchError) {
        fs.writeFileSync(output, compiled)
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

    fs.writeFileSync(output, compiled)
    versionData.setState({
      mode: Mode.EDIT,
      status: Status.OK,
      data: {
        patch: patchToEdit,
        file: output
      }
    }).saveState()
    ui.info(`baseline with all patches applied saved as ${chalk.blueBright(output)}; run '${chalk.yellowBright('codex commit')}' when you're done`)
    ui.info(`changes will be saved in patch number ${patchToEdit}`)

  }
}
