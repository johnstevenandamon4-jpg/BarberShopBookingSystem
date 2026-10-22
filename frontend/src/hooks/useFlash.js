import { useCallback, useEffect, useRef, useState } from 'react'

/** A success/info message that clears itself after a few seconds. */
export default function useFlash(duration = 4000) {
  const [message, setMessage] = useState('')
  const timer = useRef(null)

  const flash = useCallback(
    (text) => {
      window.clearTimeout(timer.current)
      setMessage(text)
      if (text) timer.current = window.setTimeout(() => setMessage(''), duration)
    },
    [duration]
  )

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return [message, flash]
}
