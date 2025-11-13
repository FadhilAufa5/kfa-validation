/**
 * Component Props Type Definitions
 * 
 * Common prop types used across multiple components
 */

import { ReactNode } from 'react';

// Layout Props
export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface LayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  header?: ReactNode;
}

// Table Props
export interface TableColumn<T = any> {
  key: string;
  header: string;
  accessor: (row: T) => any;
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

// Pagination Props
export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  perPage: number;
  total: number;
  onPageChange: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

// Filter Props
export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterProps {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

// Chart Props
export interface ChartData {
  name: string;
  value: number;
}

export interface PieChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  colors?: string[];
}

export interface BarChartProps {
  data: ChartData[];
  title?: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

// Dialog/Modal Props
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

// Form Props
export interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends FormFieldProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
}

// Status Badge Props
export interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info' | 'processing';
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

// File Upload Props
export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

// Validation specific Props
export interface ValidationStatsProps {
  fileName: string;
  score: number;
  matched: number;
  total: number;
  mismatched: number;
  invalidGroups: number;
  matchedGroups: number;
  isValid: boolean;
}

export interface ValidationGroupTableProps {
  validationId: number;
  documentType: 'pembelian' | 'penjualan';
}
