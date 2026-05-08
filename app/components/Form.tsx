'use client';

import React from 'react';

export function FormGroup({
  children,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className="erp-form-group"
      style={{
        marginBottom: 'var(--sp-16)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function FormLabel({
  children,
  required,
  style,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className="t-label"
      style={{
        fontSize: '12px',
        fontWeight: 500,
        color: 'var(--text-secondary)',
        marginBottom: 'var(--sp-4)',
        display: 'block',
        ...style,
      }}
      {...props}
    >
      {children}
      {required && <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>}
    </label>
  );
}

export function FormInput({
  style,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="erp-input"
      style={{
        height: '44px',
        width: '100%',
        padding: '0 var(--sp-12)',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-mid)',
        borderRadius: 'var(--radius)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        transition: 'all 0.15s ease',
        outline: 'none',
        ...style,
      }}
      onFocus={(e) => {
        (e.target as HTMLInputElement).style.borderColor = 'var(--brand)';
        (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--brand-light)';
      }}
      onBlur={(e) => {
        (e.target as HTMLInputElement).style.borderColor = 'var(--border-mid)';
        (e.target as HTMLInputElement).style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

export function FormSelect({
  children,
  style,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div style={{ position: 'relative' }}>
      <select
        className="erp-select"
        style={{
          height: '44px',
          width: '100%',
          padding: '0 var(--sp-12)',
          paddingRight: '36px',
          backgroundColor: 'var(--bg-input)',
          border: '1px solid var(--border-mid)',
          borderRadius: 'var(--radius)',
          color: 'var(--text-primary)',
          fontSize: '14px',
          cursor: 'pointer',
          outline: 'none',
          appearance: 'none',
          transition: 'all 0.15s ease',
          ...style,
        }}
        onFocus={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = 'var(--brand)';
          (e.target as HTMLSelectElement).style.boxShadow = '0 0 0 2px var(--brand-light)';
        }}
        onBlur={(e) => {
          (e.target as HTMLSelectElement).style.borderColor = 'var(--border-mid)';
          (e.target as HTMLSelectElement).style.boxShadow = 'none';
        }}
        {...props}
      >
        {children}
      </select>
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          right: 'var(--sp-12)',
          top: '50%',
          transform: 'translateY(-50%)',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
        }}
      >
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
    </div>
  );
}

export function FormTextarea({
  style,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      style={{
        width: '100%',
        minHeight: '100px',
        padding: 'var(--sp-12)',
        backgroundColor: 'var(--bg-input)',
        border: '1px solid var(--border-mid)',
        borderRadius: 'var(--radius)',
        color: 'var(--text-primary)',
        fontSize: '14px',
        fontFamily: 'inherit',
        transition: 'all 0.15s ease',
        outline: 'none',
        resize: 'vertical',
        ...style,
      }}
      onFocus={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = 'var(--brand)';
        (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 2px var(--brand-light)';
      }}
      onBlur={(e) => {
        (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border-mid)';
        (e.target as HTMLTextAreaElement).style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

export function FormRow({
  children,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { columns?: number }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'var(--sp-16)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function ButtonGroup({
  children,
  style,
  align = 'right',
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { align?: 'left' | 'center' | 'right' }) {
  const alignMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
  };

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--sp-12)',
        justifyContent: alignMap[align],
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
