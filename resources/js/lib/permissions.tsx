import { usePage } from '@inertiajs/react';
import React from 'react';

/**
 * Hook to get user permissions
 */
export function usePermissions(): string[] {
  const { auth } = usePage().props as { auth: { permissions: string[] } };
  return auth.permissions || [];
}

/**
 * Hook to get user role
 */
export function useRole(): { id: number; name: string; display_name: string } | null {
  const { auth } = usePage().props as { auth: { role: { id: number; name: string; display_name: string } | null } };
  return auth.role;
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(permission: string): boolean {
  const { auth } = usePage().props as { auth: { permissions: string[] } };
  return auth.permissions?.includes(permission) || false;
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(permissions: string[]): boolean {
  const { auth } = usePage().props as { auth: { permissions: string[] } };
  return permissions.some(permission => auth.permissions?.includes(permission));
}

/**
 * Check if user has all of the specified permissions
 */
export function hasAllPermissions(permissions: string[]): boolean {
  const { auth } = usePage().props as { auth: { permissions: string[] } };
  return permissions.every(permission => auth.permissions?.includes(permission));
}

/**
 * Check if user has a specific role
 */
export function hasRole(roleName: string): boolean {
  const { auth } = usePage().props as { auth: { role: { name: string } | null } };
  return auth.role?.name === roleName;
}

/**
 * Component to conditionally render content based on permissions
 */
interface CanProps {
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function Can({ permission, permissions, requireAll = false, role, children, fallback = null }: CanProps) {
  let hasAccess = false;

  if (role) {
    hasAccess = hasRole(role);
  } else if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}
