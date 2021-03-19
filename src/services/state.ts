import config from './config'
import ui from './ui'
import fs from 'fs'

export enum Mode {
  IDLE,
  EDIT
}

export enum Status {
  OK,
  PATCH_FAILED
}

export interface StateModel {
  mode: Mode;
  status: Status;
  data: Record<string, any>;
}

export const idleState: StateModel = {
  mode: Mode.IDLE,
  status: Status.OK,
  data: {}
}

export class State {

  static stateFileName = 'state.json'

  mode: Mode = Mode.IDLE
  status: Status = Status.OK
  data: Record<string, any> = {}

  public getStateFilePath(): string {
    return `${config.dir}/${State.stateFileName}`
  }

  set(state: StateModel): State {
    this.mode = state.mode
    this.status = state.status
    this.data = state.data
    return this
  }

  setIdle(): State {
    ui.debug('setting idle state')
    this.set(idleState)
    return this
  }

  load() {
    this.set(JSON.parse(fs.readFileSync(this.getStateFilePath()).toString()))
  }

  public save(): State {
    const state: StateModel = {
      mode: this.mode,
      status: this.status,
      data: this.data
    }
    ui.debug(`saving state: ${JSON.stringify(state)}`)
    fs.writeFileSync(this.getStateFilePath(), JSON.stringify(state, null, 2))
    return this
  }

}

export default new State()
