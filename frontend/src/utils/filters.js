// Safety net for search/filter. The API is asked to filter (?search=&status=)
// and these helpers re-apply the same rule to the rows that come back, so the
// UI still behaves if an endpoint ignores a parameter.

export function matchesSearch(values, term) {
  const needle = (term ?? '').trim().toLowerCase()
  if (!needle) return true
  return values.some((value) => String(value ?? '').toLowerCase().includes(needle))
}
