import config from './config'
import ui from './ui'
import fs from 'fs'
import * as json from './json'

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
  version?: number;
}

export const idleState: StateModel = {
  mode: Mode.IDLE,
  status: Status.OK,
  data: {},
  version: undefined
}

export class State {

  static stateFileName = 'state.json'

  mode: Mode = Mode.IDLE
  status: Status = Status.OK
  data: Record<string, any> = {}
  version?: number

  get(): StateModel {
    return {
      mode: this.mode,
      status: this.status,
      data: this.data,
      version: this.version
    }
  }

  public getStateFilePath(): string {
    return `${config.dir}/${State.stateFileName}`
  }

  set(state: StateModel): State {
    this.mode = state.mode
    this.status = state.status
    this.data = state.data
    this.version = state.version
    return this
  }

  setIdle(): State {
    ui.debug('setting idle state')
    this.set(idleState)
    return this
  }

  load() {
    if (fs.existsSync(this.getStateFilePath())) {
      this.set(JSON.parse(fs.readFileSync(this.getStateFilePath()).toString()))
    } else {
      ui.warning('state file not found; falling back to the default idle state')
      this.setIdle().save()
    }
  }

  public save(): State {
    const state: StateModel = {
      mode: this.mode,
      status: this.status,
      data: this.data,
      version: this.version
    }
    fs.mkdirSync(config.dir, {recursive: true})
    ui.debug(`saving state: ${json.serialize(state)}`)
    fs.writeFileSync(this.getStateFilePath(), json.serialize(state))
    return this
  }

}

export default new State()
