import config from './config'
import axios from 'axios'
import ui from './ui'
import * as auth from './auth'
import renderers from '../renderers'

export const lockName = 'codex'

export async function lock() {
  let count = 0
  while (count++ < 2) {
    try {
      ui.info('acquiring lock')
      // eslint-disable-next-line no-await-in-loop
      await axios.put(`${config.data.lockUrl}/trylock/${lockName}`, null, {
        headers: {
          Authorization: config.data.auth.token || '',
          'X-Auth-Provider': 'ldap'
        }
      })
      break
    } catch (error) {
      if (error.response === undefined) {
        ui.error(error)
      } else {
        if (error.response.status === 401 && count <= 1) {
          ui.warning('you are not logged in or your login session expired')
          // eslint-disable-next-line no-await-in-loop
          await auth.performLogin()
          continue
        }

        if (error.response.status === 409) {
          ui.error(`session already locked by ${error.response.data.error.data}`)
          throw new Error('could not acquire lock; session in progress; please try again later')
        }

        ui.error(`error encountered while trying to acquire the lock: HTTP CODE ${error.response.status}`)
        ui.error(renderers.json.marshal(error.response.data))
      }
      throw new Error('could not acquire the lock')
    }
  }
}

export async function unlock() {
  try {
    ui.info('releasing lock')
    await axios.put(`${config.data.lockUrl}/unlock/${lockName}`, null, {
      headers: {
        Authorization: config.data.auth.token || '',
        'X-Auth-Provider': 'ldap'
      }
    })
  } catch (error) {
    ui.error(`error encountered while trying to release the lock: HTTP CODE ${error.response.status}`)
    ui.error(renderers.json.marshal(error.response.data))
    throw new Error('could not release the lock')
  }
}
