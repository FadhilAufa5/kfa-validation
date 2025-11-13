/**
 * API Response Type Definitions
 * 
 * Type definitions for API responses and request payloads
 */

import { Validation, ValidationInvalidGroup, ValidationMatchedGroup } from './models';

// Generic API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Pagination
export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  filters?: Record<string, any>;
  sort?: {
    key: string;
    direction: 'asc' | 'desc';
  };
}

// Validation Data
export interface ValidationSummary {
  fileName: string;
  role: string;
  category: string;
  score: number;
  matched: number;
  total: number;
  mismatched: number;
  invalidGroups: number;
  matchedGroups: number;
  isValid: boolean;
  roundingValue: number;
}

export interface ValidationChartData {
  invalid: {
    categories: Record<string, number>;
    sources: Record<string, number>;
    topDiscrepancies: Array<{
      key: string;
      discrepancy_value: number;
    }>;
  };
  matched: {
    notes: Record<string, number>;
  };
}

export interface InvalidGroupPaginated {
  key: string;
  discrepancy_category: string;
  error: string;
  uploaded_total: number;
  source_total: number;
  discrepancy_value: number;
  sourceLabel: string;
}

export interface MatchedGroupPaginated {
  row_index?: number;
  key: string;
  uploaded_total: number;
  source_total: number;
  difference: number;
  note: string;
  is_individual_row: boolean;
}

// Dashboard Data
export interface DashboardStatistics {
  totalFiles: number;
  totalPembelian: number;
  totalPenjualan: number;
  filesChangeFromLastMonth: number;
  lastWeekPembelian: number;
  todayPenjualan: number;
}

export interface ChartDistribution {
  name: string;
  value: number;
}

export interface RecentActivity {
  id: number;
  user: string;
  action: string;
  time: string;
  isNew: boolean;
}

export interface ValidationDataStatus {
  is_pembelian_empty: boolean;
  is_penjualan_empty: boolean;
  pembelian_count: number;
  penjualan_count: number;
  has_empty_data: boolean;
}

// File Upload
export interface FileUploadResponse {
  filename: string;
}

export interface FilePreviewResponse {
  filename: string;
  preview: Array<Array<string>>;
}

export interface FileProcessResponse {
  headers: string[];
  preview: Array<Array<string>>;
}

// Validation Process
export interface ValidationResult {
  status: 'valid' | 'invalid';
  validation_id: number;
  invalid_groups?: Record<string, any>;
  invalid_rows?: Array<any>;
  mapping_info?: {
    total_rows: number;
    mapped_records: number;
    skipped_rows: number;
    failed_rows: number;
  };
}

export interface ValidationStatusResponse {
  status: 'processing' | 'completed' | 'failed';
  message?: string;
  validation_id: number;
  check_status_url?: string;
  data?: ValidationSummary;
}

// History
export interface ValidationHistory extends Validation {
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

// Document Comparison
export interface DocumentComparisonData {
  uploaded_records: Array<Record<string, any>>;
  validation_records: Array<Record<string, any>>;
  uploaded_total: number;
  source_total: number;
  uploaded_sum_field: string;
  validation_sum_field: string;
}
