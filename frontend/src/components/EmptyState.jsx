function EmptyState({ title = 'Nothing here yet', message, children }) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {children}
    </div>
  )
}

export default EmptyState
