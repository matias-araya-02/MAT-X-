import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="font-mono text-xs uppercase tracking-wider text-muted">
          {label}
        </label>
      )}
      <input
        className={`w-full bg-background border ${
          error ? 'border-red-500' : 'border-primary/30 focus:border-primary'
        } text-white font-mono text-sm px-3 py-2 outline-none transition-colors placeholder:text-muted ${className}`}
        {...props}
      />
      {error && (
        <p className="font-mono text-xs text-red-400">{error}</p>
      )}
    </div>
  )
}
