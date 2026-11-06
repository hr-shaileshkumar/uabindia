import React from 'react';
import PropTypes from 'prop-types';

export function Card({
  children,
  className = '',
  hover = false,
  glass = false,
  ...rest
}) {
  return (
    <div
      className={`rounded-2xl border transition-all duration-200 ${
        glass
          ? 'bg-white/85 backdrop-blur-md border-white/60 shadow-sm'
          : 'bg-white border-slate-200/90 shadow-2xs'
      } ${
        hover
          ? 'hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5'
          : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...rest }) {
  return (
    <div
      className={`p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '', ...rest }) {
  return (
    <h3
      className={`text-sm sm:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 ${className}`}
      {...rest}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ children, className = '', ...rest }) {
  return (
    <p className={`text-xs text-slate-500 font-normal mt-0.5 ${className}`} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({ children, className = '', ...rest }) {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...rest }) {
  return (
    <div
      className={`p-3 sm:p-4 bg-slate-50/60 border-t border-slate-100 rounded-b-2xl flex items-center justify-between gap-2 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  hover: PropTypes.bool,
  glass: PropTypes.bool,
};

export default Card;
