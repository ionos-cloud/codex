import * as diff from 'diff'
import renderers from '../renderers'

export interface SemanticDiff {
  diff?: string;
  added?: any[];
  removed?: any[];
  changed?: Record<string, SemanticDiff>;
}

function isDiff(change?: SemanticDiff): boolean {
  return (change !== undefined && (
    (change.diff !== undefined && change.diff.trim().length > 0) ||
    (change.added !== undefined && change.added.length > 0) ||
    (change.removed !== undefined && change.removed.length > 0) ||
    (change.changed !== undefined && Object.keys(change.changed).length > 0)
  ))
}

function addChange(diff: SemanticDiff, key: any, change: SemanticDiff) {
  if (diff.changed === undefined) {
    diff.changed = {}
  }
  diff.changed[key] = change
}

function semanticDiff(from: Record<any, any>, to: Record<any, any>, ignore?: any[]): SemanticDiff {
  const fromKeys = Object.keys(from)
  const toKeys = Object.keys(to)
  const commonKeys = []
  const ret: SemanticDiff = {}

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
            const serFrom = renderers.json.marshal(from[key])
            const serTo = renderers.json.marshal(to[key])
            if (serFrom !== serTo) {
              addChange(ret, key,
                {
                  diff: diff.createPatch(key, renderers.json.marshal(from[key]), renderers.json.marshal(to[key]))
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
        diff: diff.createPatch(key, renderers.json.marshal(from[key]), renderers.json.marshal(to[key]))
      })
    }

  }

  return ret
}

export default {
  isDiff,
  diff: semanticDiff,
  addChange
}
