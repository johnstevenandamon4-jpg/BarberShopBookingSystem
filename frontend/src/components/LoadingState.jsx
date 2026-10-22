function LoadingState({ label = 'Loading...' }) {
  return (
    <div className="loading-state" role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  )
}

export default LoadingState
