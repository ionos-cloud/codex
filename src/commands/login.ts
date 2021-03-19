import { flags } from '@oclif/command'

import * as auth from '../services/auth'
import config from '../services/config'
import ui from '../services/ui'
import BaseCommand from '../base/base-command'

const ionosUsernameEnvVar = 'CODEX_USERNAME'
const ionosPasswordEnvVar = 'CODEX_PASSWORD'

export default class Login extends BaseCommand {
  static description = 'authenticate using the Inside credentials'

  static examples = [ '$ codex login' ]

  static flags = {
    ...BaseCommand.flags,
    username: flags.string({char: 'u', required: false, description: 'username to login with'}),
    password: flags.string({char: 'p', required: false, description: 'password to login with'})
  }

  async run() {
    const { prompt } = require('enquirer');

    let username: string
    if (this.flags.username === undefined) {
      if (process.env[ionosUsernameEnvVar] === undefined) {
        /* ask for it */
        const answer = await prompt({
          type: 'input',
          name: 'username',
          message: 'username',
          initial: config.data.auth.username || ''
        })

        if (answer === undefined || answer.username === undefined) {
          this.error('invalid username')
        }
        username = answer.username
      } else {
        username = process.env[ionosUsernameEnvVar] as string
      }
    } else {
      username = this.flags.username
    }

    let password: string
    if (this.flags.password === undefined) {
      if (process.env[ionosPasswordEnvVar] === undefined) {
        /* ask for it */
        const answer = await prompt({
          type: 'password',
          name: 'password',
          message: 'password'
        })

        if (answer === undefined || answer.password === undefined) {
          this.error('invalid password')
        }
        password = answer.password
      } else {
        password = process.env[ionosPasswordEnvVar] as string
      }
    } else {
      ui.warning(`providing your password on the command line is unsecure; you can use the ${ionosPasswordEnvVar} env variable`)
      password = this.flags.password
    }

    config.data.auth.username = username
    config.data.auth.token = await auth.login(username, password)
    config.save()

    ui.success(`successfully logged in as ${config.data.auth.username}`)
  }
}
