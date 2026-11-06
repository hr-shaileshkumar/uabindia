/**
 * Location Hierarchy & Setup Ancestry Resolution Utility
 * 
 * Implements strict single-tier prioritized parent dropdown filtering
 * and automatic ancestral lineage linkage (Country, Zone, Region, State, Cluster, District)
 * across Company Setup & Organization Masters.
 */

/**
 * Returns the single active parent type allowed for the specified itemType,
 * strictly prioritizing the immediate predecessor tier when available in the company dataset.
 * 
 * Example:
 * - When creating Region: If Zone records exist in allItems, returns ['Zone'] ONLY.
 *   If no Zone records exist yet, falls back to ['Country'].
 */
export function getPrioritizedParentTypes(itemType, allItems = []) {
  const activeItems = (allItems || []).filter(i => i.isActive !== false && !i.isDeleted)
  const existingTypes = new Set(activeItems.map(i => i.itemType))

  switch (itemType) {
    case 'Country':
      return []

    case 'Zone':
      return ['Country']

    case 'Region':
      // If Zone is available, show ONLY Zone list. Otherwise fallback to Country.
      if (existingTypes.has('Zone')) return ['Zone']
      return ['Country']

    case 'State':
      if (existingTypes.has('Region')) return ['Region']
      if (existingTypes.has('Zone')) return ['Zone']
      return ['Country']

    case 'Cluster':
      if (existingTypes.has('State')) return ['State']
      if (existingTypes.has('Region')) return ['Region']
      if (existingTypes.has('Zone')) return ['Zone']
      return ['Country']

    case 'District':
      if (existingTypes.has('Cluster')) return ['Cluster']
      if (existingTypes.has('State')) return ['State']
      if (existingTypes.has('Region')) return ['Region']
      if (existingTypes.has('Zone')) return ['Zone']
      return ['Country']

    case 'Branch':
    case 'Location':
      if (existingTypes.has('District')) return ['District']
      if (existingTypes.has('Cluster')) return ['Cluster']
      if (existingTypes.has('State')) return ['State']
      if (existingTypes.has('Region')) return ['Region']
      if (existingTypes.has('Zone')) return ['Zone']
      return ['Country']

    case 'Department':
      return ['Department']

    case 'SubDepartment':
      return ['Department']

    case 'Designation':
      if (existingTypes.has('SubDepartment')) return ['SubDepartment', 'Department']
      return ['Department']

    default:
      return []
  }
}

/**
 * Given a parentId and the complete list of setup items,
 * walks the tree upwards to resolve and link the full ancestral relation lineage.
 * 
 * Returns:
 * - hierarchyPath: "India > East Zone > Bihar Region"
 * - relations: { countryId, countryName, zoneId, zoneName, ... }
 * - ancestors: array of parent objects from immediate parent to root
 */
export function resolveLocationAncestry(parentId, allItems = []) {
  if (!parentId) {
    return {
      hierarchyPath: '',
      relations: {},
      ancestors: []
    }
  }

  const ancestors = []
  let currId = String(parentId)
  const visited = new Set()

  while (currId && !visited.has(currId)) {
    visited.add(currId)
    const item = (allItems || []).find(i => String(i.id || i.setupItemId) === currId)
    if (!item) break
    ancestors.push(item)
    currId = item.parentId ? String(item.parentId) : null
  }

  // Reverse ancestors to order: Root (Country) -> ... -> Immediate Parent
  const rootToLeaf = [...ancestors].reverse()
  const hierarchyPath = rootToLeaf.map(a => a.setupName).join(' > ')

  const immediateParent = ancestors[0] || null
  const relations = {
    hierarchyPath,
    parentName: immediateParent?.setupName || '',
    parentType: immediateParent?.itemType || '',
    parentCode: immediateParent?.setupCode || '',
    parentId: immediateParent?.id || immediateParent?.setupItemId || null
  }

  // Populate explicit canonical level attributes
  ancestors.forEach(a => {
    const typeKey = (a.itemType || '').toLowerCase()
    relations[`${typeKey}Id`] = a.id || a.setupItemId
    relations[`${typeKey}Name`] = a.setupName
    relations[`${typeKey}Code`] = a.setupCode

    // Inspect ancestor metadataJson to inherit any higher levels if present
    try {
      const meta = typeof a.metadataJson === 'string' ? JSON.parse(a.metadataJson) : a.metadataJson
      if (meta && typeof meta === 'object') {
        const levels = ['country', 'zone', 'region', 'state', 'cluster', 'district']
        levels.forEach(lvl => {
          if (meta[`${lvl}Id`] && !relations[`${lvl}Id`]) {
            relations[`${lvl}Id`] = meta[`${lvl}Id`]
            relations[`${lvl}Name`] = meta[`${lvl}Name`]
            relations[`${lvl}Code`] = meta[`${lvl}Code`]
          }
        })
      }
    } catch {
      // ignore JSON parse errors on invalid metadata
    }
  })

  return {
    hierarchyPath,
    relations,
    ancestors,
    directParent: immediateParent
  }
}
