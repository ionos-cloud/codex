import config from './config'
import axios from 'axios'
import ui from './ui'

export const lockName = 'codex'

export async function lock() {
  try {
    ui.info('acquiring lock')
    await axios.put(`${config.data.lockUrl}/trylock/${lockName}`, null, {
      headers: {
        Authorization: config.data.auth.token,
        'X-Auth-Provider': 'ldap'
      }
    })
  } catch (error) {
    if (error.response.status === 409) {
      ui.error(`session already locked by ${error.response.data.error.data}`)
      throw new Error('could not acquire lock; session in progress; please try again later')
    }
    ui.error(`error encountered while trying to acquire the lock: HTTP CODE ${error.response.status}`)
    ui.error(JSON.stringify(error.response.data, null, 2))
    throw new Error('could not acquire the lock')
  }
}

export async function unlock() {
  try {
    ui.info('releasing lock')
    await axios.put(`${config.data.lockUrl}/unlock/${lockName}`, null, {
      headers: {
        Authorization: config.data.auth.token,
        'X-Auth-Provider': 'ldap'
      }
    })
  } catch (error) {
    ui.error(`error encountered while trying to release the lock: HTTP CODE ${error.response.status}`)
    ui.error(JSON.stringify(error.response.data, null, 2))
    throw new Error('could not release the lock')
  }
}
