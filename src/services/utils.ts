import fs from 'fs'
import * as diff from 'diff'
import axios from 'axios'
import path from 'path'
import ui from './ui'
import { CodexRenderer } from '../contract/codex-renderer'
import renderers from '../renderers'

const DEFAULT_JSON_INDENT = 4

export async function readFile(file: string, renderer: CodexRenderer): Promise<Record<any, any>> {
  let ret = {}
  if (file.startsWith('http://') || file.startsWith('https://')) {
    try {
      ui.debug(`downloading ${file}`)
      const response = await axios.get(file)
      switch (response.headers['content-type']) {
        case 'text/yaml': {
          ret = renderers.yaml.unmarshal(response.data)
          break
        }
        default: {
          ret = renderer.unmarshal(renderer.marshal(response.data))
        }
      }
    } catch (error) {
      if (error.response !== undefined && error.response.status !== undefined) {
        ui.debug(error)
        throw new Error(`could not fetch ${file}: got HTTP status code ${error.response.status}`)
      }
      throw error
    }
  } else {
    ui.debug(`reading file ${file}`)
    const str = fs.readFileSync(file).toString()
    try {
      ret = renderer.unmarshal(str)
    } catch (error) {
      throw new Error(`error decoding content from ${file}: ${error.message}`)
    }
  }

  return ret
}

/* normalizes a possibly minified json by converting it to 2 spaces indented json string */
export async function normalizeFile(file: string, renderer: CodexRenderer, indent = DEFAULT_JSON_INDENT): Promise<string> {
  return renderer.marshal(await readFile(file, renderer), indent)
}

/* create a patch from the diff of two json files */
export async function computePatch(file1: string, file2: string, renderer: CodexRenderer): Promise<string> {
  const f1 = await normalizeFile(file1, renderer)
  const f2 = await normalizeFile(file2, renderer)
  ui.debug('creating patch')
  const d = diff.createTwoFilesPatch(path.basename(file1), path.basename(file2), f1, f2)
  ui.debug('done')
  return d
}

