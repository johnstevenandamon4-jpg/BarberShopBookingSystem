import EmptyState from './EmptyState'
import LoadingState from './LoadingState'

/**
 * Generic table.
 *   columns: [{ key, header, render?(row), className? }]
 * Shows a loading state on first load, a dimmed table while refreshing,
 * and an empty state when there are no rows.
 */
function DataTable({
  columns,
  rows,
  rowKey = 'id',
  loading = false,
  emptyTitle = 'No records found',
  emptyMessage = 'Try changing your search or filters.',
  caption,
}) {
  if (loading && rows.length === 0) return <LoadingState label="Loading records..." />
  if (!loading && rows.length === 0) return <EmptyState title={emptyTitle} message={emptyMessage} />

  return (
    <div className={`admin-table-wrapper${loading ? ' is-refreshing' : ''}`} aria-busy={loading}>
      <table className="admin-table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row[rowKey]}>
              {columns.map((column) => (
                <td key={column.key} className={column.className}>
                  {column.render ? column.render(row) : (row[column.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataTable
