import { idleState, State, StateModel } from '../../src/services/state'

const mockFs = (state: StateModel): Record<string, any> => ({
  [new State().getStateFilePath()]: JSON.stringify(state, null, 2)
})

const idleMock = mockFs(idleState)

export {
  mockFs,
  idleMock
}
