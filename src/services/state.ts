import config from './config'
import ui from './ui'
import fs from 'fs'
import * as locking from './locking'
import renderers from '../renderers'

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

  get(): StateModel {
    return {
      mode: this.mode,
      status: this.status,
      data: this.data,
    }
  }

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
    }
    fs.mkdirSync(config.dir, {recursive: true})
    ui.debug(`saving state: ${renderers.json.marshal(state)}`)
    fs.writeFileSync(this.getStateFilePath(), renderers.json.marshal(state))
    return this
  }

  async reset(): Promise<State> {
    if (this.data.file !== undefined) {
      try {
        await locking.unlock()
      } catch (error) {
        ui.warning(`an error occurred while releasing the lock (ignoring): ${error.message}`)
      }
      ui.warning(`removing file ${this.data.file}`)
      fs.unlinkSync(this.data.file)
    }

    this.setIdle()
    this.save()
    return this
  }

}

export default new State()
