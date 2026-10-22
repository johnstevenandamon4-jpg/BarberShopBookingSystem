import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'

function NotFound() {
  return (
    <section className="section">
      <EmptyState title="Page not found" message="The page you are looking for does not exist or has moved.">
        <Link className="btn btn-primary btn-md" to="/">
          Back to home
        </Link>
      </EmptyState>
    </section>
  )
}

export default NotFound
