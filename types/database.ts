export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type LogLevel = 'info' | 'warn' | 'error'

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          user_id: string
          target_url: string
          status: JobStatus
          progress: number
          storage_path: string | null
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          target_url: string
          status?: JobStatus
          progress?: number
          storage_path?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          target_url?: string
          status?: JobStatus
          progress?: number
          storage_path?: string | null
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      logs: {
        Row: {
          id: number
          job_id: string
          level: LogLevel
          message: string
          created_at: string
        }
        Insert: {
          id?: number
          job_id: string
          level: LogLevel
          message: string
          created_at?: string
        }
        Update: {
          id?: number
          job_id?: string
          level?: LogLevel
          message?: string
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {
      job_status: JobStatus
      log_level: LogLevel
    }
  }
}

export type Job = Database['public']['Tables']['jobs']['Row']
export type JobInsert = Database['public']['Tables']['jobs']['Insert']
export type JobUpdate = Database['public']['Tables']['jobs']['Update']
export type Log = Database['public']['Tables']['logs']['Row']
export type LogInsert = Database['public']['Tables']['logs']['Insert']
