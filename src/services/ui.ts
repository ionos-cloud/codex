import chalk from 'chalk'
import cli from 'cli-ux'
import runConfig from './run-config'

function warning(msg: string) {
  // eslint-disable-next-line no-console
  console.warn(` ${chalk.yellowBright('! WARNING:')} ${chalk.yellow(msg)}`)
}

function error(msg: string) {
  // eslint-disable-next-line no-console
  console.error(` ${chalk.red('! ERROR:')} ${chalk.redBright(msg)}`)
}

function info(msg: string) {
  // eslint-disable-next-line no-console
  console.log(` ❯ ${msg}`)
}

function debug(msg: string) {
  if (runConfig.debug) {
    // eslint-disable-next-line no-console
    console.log(chalk.gray('  ⇢ (debug)'), chalk.gray(msg))
  }
}

export default {
  debug,
  info,
  warning,
  error
}
