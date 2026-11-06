import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enterprise SaaS Badge / Pill component.
 * Supports tones: success, danger, warning, info, purple, slate.
 */
export function Badge({
  children,
  tone = 'slate',
  size = 'md',
  dot = false,
  className = '',
  ...rest
}) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700 border-slate-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    warning: 'bg-amber-50 text-amber-800 border-amber-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
  };

  const dotColors = {
    slate: 'bg-slate-400',
    purple: 'bg-purple-600',
    rose: 'bg-rose-600',
    success: 'bg-emerald-600',
    danger: 'bg-rose-600',
    warning: 'bg-amber-600',
    info: 'bg-sky-600',
  };

  const sizes = {
    sm: 'text-[10px] px-1.5 py-0.2',
    md: 'text-[11px] px-2.5 py-0.5',
    lg: 'text-xs px-3 py-1',
  };

  const selectedTone = tones[tone] || tones.slate;
  const selectedDot = dotColors[tone] || dotColors.slate;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold tracking-tight rounded-full border ${selectedSize} ${selectedTone} ${className}`}
      {...rest}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${selectedDot} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
}

Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(['slate', 'purple', 'rose', 'success', 'danger', 'warning', 'info']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  dot: PropTypes.bool,
  className: PropTypes.string,
};

export default Badge;
