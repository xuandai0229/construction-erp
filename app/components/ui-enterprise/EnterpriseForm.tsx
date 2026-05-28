"use client";

import React from "react";

interface EnterpriseFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode;
}

export function EnterpriseForm({ children, className = "", ...props }: EnterpriseFormProps) {
  return (
    <form className={`space-y-4 ${className}`} {...props}>
      {children}
    </form>
  );
}

interface FormGroupProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ label, error, required, children, className = "" }: FormGroupProps) {
  return (
    <div className={`flex flex-col space-y-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-[var(--text-secondary)] select-none">
          {label} {required && <span className="text-[var(--destructive)]">*</span>}
        </label>
      )}
      <div className="relative flex-1">{children}</div>
      {error && <span className="text-[10px] font-medium text-[var(--destructive)] mt-0.5">{error}</span>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`w-full h-[38px] px-3 text-xs bg-[var(--input-bg)] border ${
          error ? "border-[var(--destructive)] focus:ring-[var(--destructive)]" : "border-[var(--input-border)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
        } rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-offset-0 transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full h-[38px] px-3 text-xs bg-[var(--input-bg)] border ${
          error ? "border-[var(--destructive)] focus:ring-[var(--destructive)]" : "border-[var(--input-border)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
        } rounded-[var(--radius-sm)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-offset-0 transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] disabled:opacity-50 disabled:cursor-not-allowed appearance-none pr-8 ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: "right 8px center",
          backgroundSize: "16px 16px",
          backgroundRepeat: "no-repeat"
        }}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = "Select";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full px-3 py-2 text-xs bg-[var(--input-bg)] border ${
          error ? "border-[var(--destructive)] focus:ring-[var(--destructive)]" : "border-[var(--input-border)] focus:border-[var(--primary)] focus:ring-[var(--ring)]"
        } rounded-[var(--radius-sm)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none focus:ring-2 focus:ring-offset-0 transition-[border-color,box-shadow] duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] disabled:opacity-50 disabled:cursor-not-allowed resize-none ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
