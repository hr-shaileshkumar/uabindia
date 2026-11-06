import React from 'react';
import PropTypes from 'prop-types';

/**
 * Enterprise SaaS Input component with label, icon slots, error, helper text.
 * Responsive height and touch-friendly padding.
 */
export function Input({
  id,
  label,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  helperText = '',
  disabled = false,
  required = false,
  icon: Icon,
  endIcon: EndIcon,
  onEndIconClick,
  className = '',
  inputClassName = '',
  name,
  ...rest
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
  const inputName = name || rest.name || inputId || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '_') : undefined);

  return (
    <div className={`flex flex-col space-y-1.5 w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 select-none">
            {label}
            {required && <span className="text-rose-500 ml-1">*</span>}
          </label>
        </div>
      )}

      <div className="relative flex items-center w-full">
        {Icon && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            <Icon size={16} />
          </div>
        )}

        <input
          id={inputId}
          name={inputName}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full h-10 px-3.5 rounded-xl border text-xs sm:text-sm text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none
            ${Icon ? 'pl-10' : ''}
            ${EndIcon ? 'pr-10' : ''}
            ${
              error
                ? 'border-rose-300 bg-rose-50/30 focus:border-rose-600 focus:ring-4 focus:ring-rose-100'
                : 'border-slate-300 bg-white hover:border-slate-400 focus:border-purple-600 focus:ring-4 focus:ring-purple-100/60'
            }
            ${disabled ? 'opacity-60 bg-slate-50 cursor-not-allowed' : ''}
            ${inputClassName}
          `}
          {...rest}
        />

        {EndIcon && (
          <button
            type="button"
            onClick={onEndIconClick}
            disabled={disabled || !onEndIconClick}
            className={`absolute right-3 flex items-center p-1 rounded-md text-slate-400 transition ${
              onEndIconClick ? 'hover:text-slate-700 cursor-pointer' : 'pointer-events-none'
            }`}
          >
            <EndIcon size={16} />
          </button>
        )}
      </div>

      {error ? (
        <p className="text-[11px] font-medium text-rose-600 animate-in fade-in duration-150">
          {error}
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}

Input.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  label: PropTypes.string,
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  error: PropTypes.string,
  helperText: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  icon: PropTypes.elementType,
  endIcon: PropTypes.elementType,
  onEndIconClick: PropTypes.func,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
};

export default Input;
