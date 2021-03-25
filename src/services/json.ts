import fs from 'fs'
import * as diff from 'diff'
import axios from 'axios'
import path from 'path'
import ui from './ui'

/* normalizes a possibly minified json by converting it to 2 spaces indented json string */
export async function normalize(file: string, indent = 2): Promise<string> {
  let json = {}
  if (file.startsWith('http://') || file.startsWith('https://')) {
    try {
      const response = await axios.get(file)
      json = response.data
    } catch (error) {
      if (error.response !== undefined && error.response.status !== undefined) {
        ui.debug(error)
        throw new Error(`could not fetch ${file}: got HTTP status code ${error.response.status}`)
      }
      throw error
    }
  } else {
    const str = fs.readFileSync(file).toString()
    try {
      json = JSON.parse(str)
    } catch (error) {
      throw new Error(`error decoding json from ${file}: ${error.message}`)
    }
  }

  return JSON.stringify(json, null, indent)

}

/* create a patch from the diff of two json files */
export async function computePatch(file1: string, file2: string): Promise<string> {
  return diff.createTwoFilesPatch(path.basename(file1), path.basename(file2), await normalize(file1), await normalize(file2))
}
