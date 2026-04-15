/**
 * PermissionGate Component
 * Conditionally renders children based on user permissions
 */

import React from 'react';
import { Permission } from '../lib/rbac';
import { useRBAC } from '../hooks/useRBAC';
import { Role } from '../types';
import { Lock, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface PermissionGateProps {
  /** Single permission required */
  permission?: Permission;
  /** Multiple permissions - user needs ANY of these */
  anyOf?: Permission[];
  /** Multiple permissions - user needs ALL of these */
  allOf?: Permission[];
  /** Minimum role required */
  minRole?: Role;
  /** Feature key from FEATURE_ACCESS */
  feature?: string;
  /** Content to render if permission granted */
  children: React.ReactNode;
  /** Content to render if permission denied (optional) */
  fallback?: React.ReactNode;
  /** Show access denied message instead of hiding */
  showDenied?: boolean;
  /** Custom denied message */
  deniedMessage?: string;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  permission,
  anyOf,
  allOf,
  minRole,
  feature,
  children,
  fallback = null,
  showDenied = false,
  deniedMessage,
}) => {
  const { can, canAny, canAll, canAccess, isEqualOrHigherThan, getRoleLabel, role } = useRBAC();
  const { t } = useLanguage();

  let hasAccess = true;

  // Check single permission
  if (permission) {
    hasAccess = hasAccess && can(permission);
  }

  // Check any of permissions
  if (anyOf && anyOf.length > 0) {
    hasAccess = hasAccess && canAny(anyOf);
  }

  // Check all of permissions
  if (allOf && allOf.length > 0) {
    hasAccess = hasAccess && canAll(allOf);
  }

  // Check minimum role
  if (minRole) {
    hasAccess = hasAccess && isEqualOrHigherThan(minRole);
  }

  // Check feature access
  if (feature) {
    hasAccess = hasAccess && canAccess(feature);
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (showDenied) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('accessDenied')}
        </h3>
        <p className="text-white/60 text-sm max-w-xs">
          {deniedMessage || t('noPermissionMessage')}
        </p>
        <div className="mt-4 px-3 py-1 rounded-full bg-white/10 text-white/50 text-xs">
          {t('yourRole')}: {getRoleLabel(role)}
        </div>
      </div>
    );
  }

  return <>{fallback}</>;
};

/**
 * Button wrapper that disables/hides based on permission
 */
interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  permission?: Permission;
  anyOf?: Permission[];
  minRole?: Role;
  hideIfDenied?: boolean;
  children: React.ReactNode;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  permission,
  anyOf,
  minRole,
  hideIfDenied = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const { can, canAny, isEqualOrHigherThan } = useRBAC();

  let hasAccess = true;

  if (permission) {
    hasAccess = hasAccess && can(permission);
  }

  if (anyOf && anyOf.length > 0) {
    hasAccess = hasAccess && canAny(anyOf);
  }

  if (minRole) {
    hasAccess = hasAccess && isEqualOrHigherThan(minRole);
  }

  if (!hasAccess && hideIfDenied) {
    return null;
  }

  return (
    <button
      {...props}
      disabled={disabled || !hasAccess}
      className={`${className} ${!hasAccess ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {children}
      {!hasAccess && (
        <Lock className="w-3 h-3 ml-1 inline-block" />
      )}
    </button>
  );
};

/**
 * Role Badge Component
 */
interface RoleBadgeProps {
  role: Role;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  showLabel = true,
}) => {
  const { getRoleLabel, roleInfo } = useRBAC();
  const info = roleInfo;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  // Get role-specific colors
  const getRoleColors = (r: Role) => {
    switch (r) {
      case 'SHG Leader':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'Animator':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'CRP':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${sizeClasses[size]}
        ${getRoleColors(role)}
      `}
    >
      {showLabel ? getRoleLabel(role) : role.charAt(0)}
    </span>
  );
};

/**
 * Access Level Indicator
 */
interface AccessLevelProps {
  showDetails?: boolean;
}

export const AccessLevelIndicator: React.FC<AccessLevelProps> = ({
  showDetails = false,
}) => {
  const { role, roleLevel, permissions, getRoleLabel } = useRBAC();
  const { t } = useLanguage();

  return (
    <div className="bg-white/5 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white/60 text-sm">{t('accessLevel')}</span>
        <RoleBadge role={role} size="sm" />
      </div>
      
      <div className="flex items-center gap-1 mb-2">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-2 flex-1 rounded-full ${
              level <= roleLevel ? 'bg-primary' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-xs text-white/40 mb-2">
            {t('permissionsCount')}: {permissions.length}
          </p>
          <div className="flex flex-wrap gap-1">
            {permissions.slice(0, 5).map((perm) => (
              <span
                key={perm}
                className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/60"
              >
                {perm.replace(/_/g, ' ')}
              </span>
            ))}
            {permissions.length > 5 && (
              <span className="text-xs text-white/40">
                +{permissions.length - 5} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
