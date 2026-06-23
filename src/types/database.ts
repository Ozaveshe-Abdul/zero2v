export type AuditSeverity = 'info' | 'warning' | 'critical';

export type AuditEvent =
  // Auth events
  | 'user_registered'
  | 'user_login'
  | 'user_login_failed'
  | 'user_logout'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'session_expired'

  // Wallet events
  | 'wallet_funding_initiated'
  | 'wallet_funding_completed'
  | 'wallet_funding_failed'
  | 'wallet_credited'
  | 'wallet_debited'
  | 'wallet_refunded'
  | 'credits_deducted'

  // Verification events
  | 'nin_verification_requested'
  | 'nin_verification_success'
  | 'nin_verification_failed'
  | 'nin_phone_search_requested'
  | 'nin_phone_search_success'
  | 'nin_phone_search_failed'
  | 'nin_tracking_requested'
  | 'nin_tracking_success'
  | 'nin_tracking_failed'
  | 'nin_demography_requested'
  | 'nin_demography_success'
  | 'nin_demography_failed'

  // Batch events
  | 'batch_job_created'
  | 'batch_job_started'
  | 'batch_job_completed'
  | 'batch_job_failed'
  | 'batch_item_success'
  | 'batch_item_failed'
  | 'batch_item_refunded'

  // Modification order events
  | 'modification_order_submitted'
  | 'modification_order_status_checked'
  | 'modification_order_refunded'

  // Export events
  | 'history_exported_pdf'
  | 'history_exported_csv'
  | 'wallet_statement_exported'
  | 'order_receipt_exported'
  | 'batch_report_exported'

  // Security events
  | 'rate_limit_hit'
  | 'insufficient_balance_attempt'
  | 'consent_missing_attempt'
  | 'invalid_nin_format_attempt'
  | 'suspicious_phone_query_pattern'
  | 'unauthorized_api_access'
  | 'webhook_signature_invalid'
  | 'duplicate_webhook_reference'

  // Admin/system events
  | 'api_key_used'
  | 'supabase_service_role_used';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'credit' | 'debit' | 'refund';
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  reference: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface ApiCall {
  id: string;
  user_id: string;
  action_type: 'nin_verification' | 'nin_phone_search' | 'nin_tracking' | 'nin_demography' | 'nin_modification_order' | 'batch_item';
  endpoint: string;
  label: string | null;
  request_payload: Record<string, any> | null;
  response_data: Record<string, any> | null;
  report_id: string | null;
  cost: number;
  status: 'success' | 'error' | 'refunded';
  batch_id: string | null;
  created_at: string;
}

export interface BatchJob {
  id: string;
  user_id: string;
  endpoint: string;
  total_items: number;
  completed_items: number;
  failed_items: number;
  total_cost: number;
  status: 'queued' | 'running' | 'completed' | 'partial' | 'failed';
  result_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModificationOrder {
  id: string;
  user_id: string;
  service_type: string;
  reference_id: string;
  amount_charged: number;
  status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected';
  request_payload: Record<string, any> | null;
  response_data: Record<string, any> | null;
  submitted_at: string;
  updated_at: string;
}

export interface PaystackEvent {
  id: string;
  event_type: string;
  reference: string;
  payload: Record<string, any>;
  processed: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  event: AuditEvent;
  severity: AuditSeverity;
  user_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

// Global Database wrapper for general typing
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Partial<Profile>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Transaction>;
      };
      api_calls: {
        Row: ApiCall;
        Insert: Omit<ApiCall, 'id' | 'status' | 'created_at'> & { id?: string; status?: ApiCall['status']; created_at?: string };
        Update: Partial<ApiCall>;
      };
      batch_jobs: {
        Row: BatchJob;
        Insert: Omit<BatchJob, 'id' | 'completed_items' | 'failed_items' | 'status' | 'created_at' | 'updated_at'> & {
          id?: string;
          completed_items?: number;
          failed_items?: number;
          status?: BatchJob['status'];
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<BatchJob>;
      };
      modification_orders: {
        Row: ModificationOrder;
        Insert: Omit<ModificationOrder, 'id' | 'status' | 'submitted_at' | 'updated_at'> & {
          id?: string;
          status?: ModificationOrder['status'];
          submitted_at?: string;
          updated_at?: string;
        };
        Update: Partial<ModificationOrder>;
      };
      paystack_events: {
        Row: PaystackEvent;
        Insert: Omit<PaystackEvent, 'id' | 'processed' | 'created_at'> & { id?: string; processed?: boolean; created_at?: string };
        Update: Partial<PaystackEvent>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Omit<AuditLog, 'id' | 'severity' | 'created_at'> & { id?: string; severity?: AuditSeverity; created_at?: string };
        Update: Partial<AuditLog>;
      };
    };
    Enums: {
      transaction_type: 'credit' | 'debit' | 'refund';
      api_call_status: 'success' | 'error' | 'refunded';
      action_type: 'nin_verification' | 'nin_phone_search' | 'nin_tracking' | 'nin_demography' | 'nin_modification_order' | 'batch_item';
      batch_status: 'queued' | 'running' | 'completed' | 'partial' | 'failed';
      order_status: 'pending' | 'processing' | 'approved' | 'completed' | 'rejected';
      audit_severity: AuditSeverity;
      audit_event: AuditEvent;
    };
  };
}
