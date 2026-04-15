/**
 * Role-Based Access Control Hook
 * Provides easy-to-use permission checking for components
 */

import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Permission, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  canAccessFeature,
  isHigherRole,
  isEqualOrHigherRole,
  getPermissions,
  ROLE_INFO,
  ROLE_HIERARCHY
} from '../lib/rbac';
import { Role } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const useRBAC = () => {
  const { currentUserRole, user } = useAuth();
  const { language } = useLanguage();

  /**
   * Check if current user has a specific permission
   */
  const can = useCallback((permission: Permission): boolean => {
    return hasPermission(currentUserRole, permission);
  }, [currentUserRole]);

  /**
   * Check if current user has any of the specified permissions
   */
  const canAny = useCallback((permissions: Permission[]): boolean => {
    return hasAnyPermission(currentUserRole, permissions);
  }, [currentUserRole]);

  /**
   * Check if current user has all of the specified permissions
   */
  const canAll = useCallback((permissions: Permission[]): boolean => {
    return hasAllPermissions(currentUserRole, permissions);
  }, [currentUserRole]);

  /**
   * Check if current user can access a specific feature
   */
  const canAccess = useCallback((featureKey: string): boolean => {
    return canAccessFeature(currentUserRole, featureKey);
  }, [currentUserRole]);

  /**
   * Check if current user's role is higher than another role
   */
  const isHigherThan = useCallback((role: Role): boolean => {
    return isHigherRole(currentUserRole, role);
  }, [currentUserRole]);

  /**
   * Check if current user's role is equal or higher than another role
   */
  const isEqualOrHigherThan = useCallback((role: Role): boolean => {
    return isEqualOrHigherRole(currentUserRole, role);
  }, [currentUserRole]);

  /**
   * Get all permissions for current user
   */
  const permissions = useMemo(() => {
    return getPermissions(currentUserRole);
  }, [currentUserRole]);

  /**
   * Get role display info with localized label
   */
  const getRoleLabel = useCallback((role: Role): string => {
    const info = ROLE_INFO[role];
    if (!info) return role;
    
    switch (language) {
      case 'hi': return info.labelHi;
      case 'ta': return info.labelTa;
      case 'te': return info.labelTe;
      case 'kn': return info.labelKn;
      default: return info.label;
    }
  }, [language]);

  /**
   * Get current user's role info
   */
  const roleInfo = useMemo(() => {
    return ROLE_INFO[currentUserRole];
  }, [currentUserRole]);

  /**
   * Get current user's role level in hierarchy
   */
  const roleLevel = useMemo(() => {
    return ROLE_HIERARCHY[currentUserRole];
  }, [currentUserRole]);

  /**
   * Check if user is a leader (SHG Leader or CRP)
   */
  const isLeader = useMemo(() => {
    return currentUserRole === 'SHG Leader' || currentUserRole === 'CRP';
  }, [currentUserRole]);

  /**
   * Check if user is an animator or higher
   */
  const isAnimatorOrHigher = useMemo(() => {
    return isEqualOrHigherRole(currentUserRole, 'Animator');
  }, [currentUserRole]);

  /**
   * Check if user is just a regular member
   */
  const isMemberOnly = useMemo(() => {
    return currentUserRole === 'Member';
  }, [currentUserRole]);

  /**
   * Check if current user can manage another member based on role
   */
  const canManageMember = useCallback((memberRole: Role): boolean => {
    // Can only manage members with lower role
    return isHigherRole(currentUserRole, memberRole);
  }, [currentUserRole]);

  /**
   * Check if current user can view another member's data
   */
  const canViewMemberData = useCallback((memberId: string, dataType: 'transactions' | 'loans' | 'documents'): boolean => {
    // Users can always view their own data
    if (user?.memberId === memberId) return true;
    
    // Check permission based on data type
    switch (dataType) {
      case 'transactions':
        return hasPermission(currentUserRole, 'view_transactions');
      case 'loans':
        return hasPermission(currentUserRole, 'view_loans');
      case 'documents':
        return hasPermission(currentUserRole, 'view_member_documents');
      default:
        return false;
    }
  }, [currentUserRole, user?.memberId]);

  return {
    // Permission checks
    can,
    canAny,
    canAll,
    canAccess,
    
    // Role comparisons
    isHigherThan,
    isEqualOrHigherThan,
    canManageMember,
    canViewMemberData,
    
    // Role info
    role: currentUserRole,
    roleInfo,
    roleLevel,
    permissions,
    getRoleLabel,
    
    // Convenience flags
    isLeader,
    isAnimatorOrHigher,
    isMemberOnly,
  };
};
