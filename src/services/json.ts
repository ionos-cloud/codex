import fs from 'fs'
import * as diff from 'diff'
import axios from 'axios'
import path from 'path'
import ui from './ui'
import * as json from './json'

const DEFAULT_JSON_INDENT = 4

export interface JsonSemanticDiff {
  diff?: string;
  added?: any[];
  removed?: any[];
  changed?: Record<string, JsonSemanticDiff>;
}

export async function jsonRead(file: string): Promise<Record<any, any>> {
  let json = {}
  if (file.startsWith('http://') || file.startsWith('https://')) {
    try {
      ui.debug(`downloading ${file}`)
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
    ui.debug(`reading file ${file}`)
    const str = fs.readFileSync(file).toString()
    try {
      json = JSON.parse(str)
    } catch (error) {
      throw new Error(`error decoding json from ${file}: ${error.message}`)
    }
  }

  return json
}

export function serialize(obj: Record<string, any>, indent = DEFAULT_JSON_INDENT): string {
  return JSON.stringify(obj, null, indent)
}

/* normalizes a possibly minified json by converting it to 2 spaces indented json string */
export async function normalizeFile(file: string, indent = DEFAULT_JSON_INDENT): Promise<string> {
  return serialize(await jsonRead(file), indent)
}

/* create a patch from the diff of two json files */
export async function computePatch(file1: string, file2: string): Promise<string> {
  const f1 = await normalizeFile(file1)
  const f2 = await normalizeFile(file2)
  ui.debug('creating patch')
  const d = await diff.createTwoFilesPatch(path.basename(file1), path.basename(file2), f1, f2)
  ui.debug('done')
  return d
}

function isDiff(change?: JsonSemanticDiff): boolean {
  return (change !== undefined && (
    (change.diff !== undefined && change.diff.trim().length > 0) ||
    (change.added !== undefined && change.added.length > 0) ||
    (change.removed !== undefined && change.removed.length > 0) ||
    (change.changed !== undefined && Object.keys(change.changed).length > 0)
  ))
}

function addChange(diff: JsonSemanticDiff, key: any, change: JsonSemanticDiff) {
  if (diff.changed === undefined) {
    diff.changed = {}
  }
  diff.changed[key] = change
}

export function semanticDiff(from: Record<any, any>, to: Record<any, any>, ignore?: any[]): JsonSemanticDiff {
  const fromKeys = Object.keys(from)
  const toKeys = Object.keys(to)
  const commonKeys = []
  const ret: JsonSemanticDiff = { }

  /* compute removed keys */
  for (const key of fromKeys) {

    if (ignore !== undefined && ignore.includes(key)) {
      continue
    }

    if (toKeys.includes(key)) {
      commonKeys.push(key)
    } else {
      if (ret.removed === undefined) {
        ret.removed = []
      }
      ret.removed.push(key)
    }
  }

  /* compute added keys */
  for (const key of toKeys) {
    if (ignore !== undefined && ignore.includes(key)) {
      continue
    }
    if (!fromKeys.includes(key)) {
      if (ret.added === undefined) {
        ret.added = []
      }
      ret.added.push(key)
    }
  }

  /* compute changed keys */
  for (const key of commonKeys) {
    if (ignore !== undefined && ignore.includes(key)) {
      continue
    }
    if (typeof from[key] === typeof to[key]) {
      switch (typeof from[key]) {
        case 'string':
          if (from[key] !== to[key]) {
            addChange(ret, key, {
              diff: diff.createPatch(key, from[key], to[key])
            })
          }
          break
        case 'object':
          if (Array.isArray(from[key])) {
            const serFrom = serialize(from[key])
            const serTo = serialize(to[key])
            if (serFrom !== serTo) {
              addChange(ret, key,
                {
                  diff: diff.createPatch(key, json.serialize(from[key]), json.serialize(to[key]))
                }
              )
            }

          } else {
            const keyDiff = semanticDiff(from[key], to[key], ignore)
            if (isDiff(keyDiff)) {
              addChange(ret, key, keyDiff)
            }
          }
      }
    } else {
      addChange(ret, key, {
        diff: diff.createPatch(key, json.serialize(from[key]), json.serialize(to[key]))
      })
    }

  }

  return ret
}
