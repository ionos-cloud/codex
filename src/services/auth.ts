import config from './config'
import axios from 'axios'
import { cli } from 'cli-ux'
import ui from './ui'

/**
 * login and obtain a jwt token
 * @param {string} username - login user
 * @param {string} password - login password
 *
 * @returns {string} jwt token
 */
export async function login(username: string, password: string): Promise<string> {
  try {
    const response = await axios.post(`${config.data.authUrl}/login`, {
      username: username,
      password: password
    }, {
      headers: {
        'X-Auth-Provider': 'ldap'
      }
    })
    return response.data.jwt
  } catch (error) {
    if (error.response.status === 401) {
      throw new Error('login failed: invalid username or password')
    }
    cli.error(`login request failed with HTTP status code ${error.response.status}`)
    cli.error(`response was: ${JSON.stringify(error.response.data, null, 2)}`)
    throw new Error('login failed')
  }
}

export async function validate(token: string): Promise<boolean> {
  try {
    const response = await axios.get(`${config.data.authUrl}/validation`, {
      headers: {
        Authorization: token,
        'X-Auth-Provider': 'ldap'
      }
    })
    return response.status === 200;
  } catch (error) {
    if (error.response.status === 401) {
      ui.warning('existing auth token is invalid or expired; you will need to login again')
      return false
    }
    ui.error(`auth validation request failed with HTTP status code ${error.response.status}`)
    ui.error(`response was: ${JSON.stringify(error.response.data, null, 2)}`)
    ui.warning('you will need to login again')
    return false
  }
}

export async function performLogin() {

  ui.info('please login using your Inside account')

  const { prompt } = require('enquirer');

  const answer = await prompt([{
    type: 'input',
    name: 'username',
    message: 'username'
  }, {
    type: 'password',
    name: 'password',
    message: 'password'
  }]);

  /* save token in config */
  config.data.auth.token = await login(answer.username, answer.password)
  config.data.auth.username = answer.username
  await config.save()

}

/**
 * check whether we have a valid token or not
 */
export async function check() {
  if (config.data.auth.token.length === 0) {
    await performLogin()
    return
  }
  ui.info('validating existing auth token')
  const valid = await validate(config.data.auth.token)
  if (!valid) {
    await performLogin()
  }
}
