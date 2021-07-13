
import { Codex } from '../services/codex'
import BaseCommand from '../base/base-command'
import ui from '../services/ui'
import * as diff from 'diff'

export default class SdkChanges extends BaseCommand {
  static description = 'display changes brought in by the SDK patches'

  static examples = [
    '$ codex sdk-changes',
  ]

  static flags = {
    ...BaseCommand.flags,
  }

  async run() {

    const codex = new Codex()
    await codex.load()

    const baseline = codex.getBaseline()
    const compiled = await codex.compileAll()

    ui.eol()
    ui.printPatch(diff.createPatch('swagger.json', baseline, compiled))

  }
}
