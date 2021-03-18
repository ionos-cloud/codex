import {Command, flags} from '@oclif/command'

import runConfig from '../services/run-config'
import * as auth from '../services/auth'
import config from '../services/config'
import ui from '../services/ui'

const ionosUsernameEnvVar = 'CODEX_USERNAME'
const ionosPasswordEnvVar = 'CODEX_PASSWORD'

export default class Login extends Command {
  static description = 'authenticate using the Inside credentials'

  static examples = [ '$ codex login' ]

  static flags = {
    help: flags.help({char: 'h'}),
    debug: flags.boolean({char: 'd', default: false}),
    username: flags.string({char: 'u', required: false, description: 'username to login with'}),
    password: flags.string({char: 'p', required: false, description: 'password to login with'})
  }

  protected async catch(err: any) {
    ui.error(err.message)
  }

  async run() {
    const {flags} = this.parse(Login)
    runConfig.debug = flags.debug

    config.check()
    config.load()

    const { prompt } = require('enquirer');

    let username: string
    if (flags.username === undefined) {
      if (process.env[ionosUsernameEnvVar] === undefined) {
        /* ask for it */
        const answer = await prompt({
          type: 'input',
          name: 'username',
          message: 'username',
          initial: config.data.username || ''
        })

        if (answer === undefined || answer.username === undefined) {
          this.error('invalid username')
        }
        username = answer.username
      } else {
        username = process.env[ionosUsernameEnvVar] as string
      }
    } else {
      username = flags.username
    }

    let password: string
    if (flags.password === undefined) {
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
      password = flags.password
    }

    config.data.username = username
    config.data.token = await auth.login(username, password)
    config.save()

    ui.success(`successfully logged in as ${config.data.username}`)
  }
}
