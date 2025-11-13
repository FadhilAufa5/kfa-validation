/**
 * Domain Models Type Definitions
 * 
 * Type definitions for the main domain models used throughout the application
 */

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'super_admin' | 'user' | 'visitor';
  assigned_user_id?: number;
  created_by_admin?: boolean;
  email_verified_at?: string;
  two_factor_enabled?: boolean;
  last_activity?: string;
  created_at: string;
  updated_at: string;
}

export interface Validation {
  id: number;
  file_name: string;
  user_id: number;
  role: string;
  document_type: 'pembelian' | 'penjualan';
  document_category: string;
  score: number;
  total_records: number;
  matched_records: number;
  mismatched_records: number;
  status: 'processing' | 'completed' | 'failed';
  processing_details?: Record<string, any>;
  validation_details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ValidationInvalidGroup {
  id: number;
  validation_id: number;
  key_value: string;
  discrepancy_category: 'im_invalid' | 'missing' | 'discrepancy';
  error: string;
  uploaded_total: number;
  source_total: number;
  discrepancy_value: number;
  created_at: string;
  updated_at: string;
}

export interface ValidationMatchedGroup {
  id: number;
  validation_id: number;
  key_value: string;
  uploaded_total: number;
  source_total: number;
  difference: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface ValidationReport {
  id: number;
  validation_id: number;
  user_id: number;
  description: string;
  status: 'pending' | 'accepted' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: number;
  user_id?: number;
  user_name: string;
  user_role?: string;
  action: string;
  category?: string;
  entity_type?: string;
  entity_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}
