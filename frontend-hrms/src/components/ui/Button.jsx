import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enterprise SaaS Button component.
 * Supports primary, secondary, outline, danger, ghost variants.
 * Supports leading/trailing icons, loading spinner, and responsive heights.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...rest
}) {
  const base =
    'relative inline-flex items-center justify-center whitespace-nowrap font-bold tracking-tight rounded-xl transition-all duration-150 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 h-8 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 h-10 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 h-11 gap-2.5',
  };

  const variants = {
    primary:
      'bg-gradient-to-r from-purple-700 via-rose-600 to-orange-500 hover:from-purple-800 hover:via-rose-700 hover:to-orange-600 text-white shadow-md shadow-purple-600/20 focus:ring-purple-500 border border-transparent',
    secondary:
      'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs focus:ring-slate-400',
    outline:
      'bg-transparent border border-purple-600 text-purple-700 hover:bg-purple-50/70 focus:ring-purple-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white shadow-sm shadow-rose-600/20 focus:ring-rose-500 border border-transparent',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 focus:ring-slate-300',
  };

  const selectedSize = sizes[size] || sizes.md;
  const selectedVariant = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`${base} ${selectedSize} ${selectedVariant} ${className}`}
      {...rest}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
          <span className="truncate">{children}</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />}
          <span className="truncate inline-flex items-center justify-center gap-1.5">{children}</span>
          {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 14 : 16} className="shrink-0" />}
        </>
      )}
    </button>
  );
}

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'outline', 'danger', 'ghost']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  icon: PropTypes.elementType,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
};

export default Button;
