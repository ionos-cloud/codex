import chalk from 'chalk'
import runConfig from './run-config'
import cli from 'cli-ux'

const indent = ''

function warning(msg: string) {
  // eslint-disable-next-line no-console
  process.stdout.write(`${chalk.yellowBright('! WARNING:')} ${chalk.yellow(msg)}\n`)
}

function error(msg: string) {
  // eslint-disable-next-line no-console
  process.stdout.write(`${chalk.red('! ERROR:')} ${chalk.redBright(msg)}\n`)
}

function info(msg: string) {
  // eslint-disable-next-line no-console
  cli.info(`${indent}❯ ${msg}`)
}

function debug(msg: string) {
  if (runConfig.debug) {
    // eslint-disable-next-line no-console
    process.stdout.write(`${indent}${chalk.gray('  ⇢ (debug)')} ${chalk.gray(msg)}\n`)
  }
}

function success(msg: string) {
  process.stdout.write(chalk.greenBright(`${indent}✔ ${msg}\n`))
}

function eol() {
  process.stdout.write('\n')
}

function print(data: any) {
  let str = ''
  if (typeof data === 'object') {
    str = JSON.stringify(data, null, 2)
  } else {
    str = data
  }

  process.stdout.write(str)
}

export default {
  debug,
  info,
  warning,
  error,
  success,
  eol,
  print
}
