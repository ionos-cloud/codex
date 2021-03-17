import chalk from 'chalk'
import runConfig from './run-config'
import cli from 'cli-ux'

function warning(msg: string) {
  // eslint-disable-next-line no-console
  process.stdout.write(` ${chalk.yellowBright('! WARNING:')} ${chalk.yellow(msg)} \n`)
}

function error(msg: string) {
  // eslint-disable-next-line no-console
  process.stdout.write(` ${chalk.red('! ERROR:')} ${chalk.redBright(msg)} \n`)
}

function info(msg: string) {
  // eslint-disable-next-line no-console
  cli.info(` ❯ ${msg}`)
}

function debug(msg: string) {
  if (runConfig.debug) {
    // eslint-disable-next-line no-console
    process.stdout.write(`${chalk.gray('  ⇢ (debug)')} ${chalk.gray(msg)} \n`)
  }
}

export default {
  debug,
  info,
  warning,
  error
}
