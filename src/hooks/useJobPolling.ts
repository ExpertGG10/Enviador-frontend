import { useEffect, useRef, useState } from 'react'
import { config } from '../config'

type JobState = {
  job_id: string
  state: string
  total: number
  processed: number
  success: number
  failed: number
  items: Array<any>
  error?: string | null
}

export function useJobPolling(jobId: string | null, token: string | null, intervalMs = 1000) {
  const [job, setJob] = useState<JobState | null>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!jobId) return
    let mounted = true

    async function fetchStatus() {
      try {
        const resp = await fetch(`${config.API_URL}/api/jobs/${jobId}/`, {
          headers: token ? { 'Authorization': `Token ${token}` } : undefined
        })
        if (!resp.ok) return
        const data = await resp.json()
        if (!mounted) return
        setJob(data)
        if (data.state === 'done' || data.state === 'error') {
          // stop polling
          if (timerRef.current) window.clearInterval(timerRef.current)
          timerRef.current = null
        }
      } catch (e) {
        // ignore for now
      }
    }

    fetchStatus()
    timerRef.current = window.setInterval(fetchStatus, intervalMs)

    return () => {
      mounted = false
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [jobId, token, intervalMs])

  async function cancelJob() {
    if (!jobId) return
    try {
      await fetch(`${config.API_URL}/api/jobs/${jobId}/cancel/`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Token ${token}` } : undefined
      })
    } catch (e) {
      // ignore
    }
  }

  return { job, cancelJob }
}

export type { JobState }
