import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface BatchJobState {
  id: string
  endpoint: string
  total_items: number
  completed_items: number
  failed_items: number
  total_cost: number
  status: 'queued' | 'running' | 'completed' | 'partial' | 'failed'
}

export function useBatchJob(batchId: string | null) {
  const [job, setJob] = useState<BatchJobState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!batchId) return

    let isMounted = true

    // Fetch initial state
    const fetchJob = async () => {
      const { data, error } = await supabase
        .from('batch_jobs')
        .select('*')
        .eq('id', batchId)
        .single()

      if (error) {
        if (isMounted) setError(error.message)
      } else if (data && isMounted) {
        setJob(data as BatchJobState)
      }
    }

    fetchJob()

    // Subscribe to realtime updates for this batch row
    const subscription = supabase
      .channel(`batch_${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'batch_jobs',
          filter: `id=eq.${batchId}`,
        },
        (payload) => {
          if (isMounted) {
            setJob(payload.new as BatchJobState)
          }
        }
      )
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(subscription)
    }
  }, [batchId, supabase])

  return { job, error }
}
