import { Flags } from '@oclif/core'
import { S3Client, ListBucketsCommand, Bucket } from '@aws-sdk/client-s3'

import BaseCommand from '../base/base-command'
import config from '../services/config'
import ui from '../services/ui'
import chalk from 'chalk'

export default class Buckets extends BaseCommand {
  static description = 'list S3 buckets on the configured account'

  static examples = [
    '$ codex buckets',
    '$ codex buckets --filter codex',
    '$ codex buckets -f api',
  ]

  static flags = {
    ...BaseCommand.flags,
    filter: Flags.string({char: 'f', required: false, description: 'filter buckets by substring match on name'}),
  }

  async run() {
    const s3 = new S3Client({
      credentials: {
        accessKeyId: config.data.s3.key,
        secretAccessKey: config.data.s3.secret,
      },
      endpoint: config.data.s3.endpoint.startsWith('http')
        ? config.data.s3.endpoint
        : `https://${config.data.s3.endpoint}`,
      region: config.data.s3.region,
      forcePathStyle: true,
    })

    ui.debug('[s3] listing buckets')

    let data
    try {
      data = await s3.send(new ListBucketsCommand({}))
    } catch (error: any) {
      ui.debug(error.stack)
      throw new Error(`[s3] could not list buckets: ${error.message}`)
    }

    let buckets: Bucket[] = data.Buckets ?? []

    if (this.flags.filter) {
      const term = this.flags.filter.toLowerCase()
      buckets = buckets.filter((b: Bucket) => b.Name?.toLowerCase().includes(term))
    }

    if (buckets.length === 0) {
      ui.warning(this.flags.filter
        ? `no buckets matching '${this.flags.filter}'`
        : 'no buckets found')
      return
    }

    const current = config.data.s3.bucket

    for (const bucket of buckets) {
      const name = bucket.Name ?? '<unnamed>'
      const created = bucket.CreationDate
        ? bucket.CreationDate.toISOString().split('T')[0]
        : 'unknown'
      const marker = name === current ? chalk.greenBright(' (active)') : ''
      ui.info(`${chalk.yellowBright(name)}  created ${chalk.gray(created)}${marker}`)
    }

    ui.eol()
    ui.info(`${buckets.length} bucket(s) found`)
  }
}
