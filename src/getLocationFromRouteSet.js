import { serializeParams } from './SerializationUtils'
import { formatPattern } from './PatternUtils'
import joinPaths from './joinPaths'
import { createSearch, parseSearch } from './SearchUtils'


function getJunctionsLocation(isRouteInPath, parentJunctionPath, junctionSet, routeSet) {
  let path
  const state = {}
  const query = {}

  const routeKeys = Object.keys(routeSet)
  for (let i = 0, len = routeKeys.length; i < len; i++) {
    const routeKey = routeKeys[i]
    const junctionPath = parentJunctionPath.concat(routeKey)
    const route = routeSet[routeKey]
    const branch = route.branch

    const isPrimaryRoute = isRouteInPath && junctionSet.$$junctionSetMeta.primaryKey == routeKey
    if (isPrimaryRoute) {
      path = formatPattern(branch.pattern, route.params)

      // TODO:
      // - add query from rest of params
      // - throw error if there are remaining params
    }
    else {
      state[junctionPath.join('/')] = {
        branchKey: branch.key,
        serializedParams: serializeParams(branch.params, route.params),
      }
    }

    if (branch.children) {
      const childLocation = getJunctionsLocation(isPrimaryRoute, junctionPath, branch.children, route.children)

      Object.assign(state, childLocation.state)

      if (childLocation.path) {
        path += '/' + childLocation.path
      }
    }

    // TODO: handle child location query
  }

  return { state, path, query }
}


// Convert a RouteSet into a Location object for the `history` package,
// which is used to actually perform navigation.
//
// See https://github.com/mjackson/history
export default function getLocationFromRouteSet(baseLocation, isRouteInPath, parentJunctionPath, junctionSet, routeSet) {
  const { state, path, query } = getJunctionsLocation(isRouteInPath, parentJunctionPath, junctionSet, routeSet)

  const baseQuery = parseSearch(baseLocation.search)
  const baseState = baseLocation.state || {}
  const finalQuery = Object.assign({}, baseQuery, query)

  return {
    pathname: joinPaths(baseLocation.pathname, path),
    hash: baseLocation.hash,
    state: Object.assign({}, baseState, { $$junctions: Object.assign(state, baseState.$$junctions) }),
    key: baseLocation.key,
    query: finalQuery,
    search: createSearch(finalQuery),
  }
}
