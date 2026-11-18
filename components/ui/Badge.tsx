interface BadgeProps {
  children: React.ReactNode
  variant?: 'discount' | 'stock' | 'category' | 'status'
  className?: string
}

export function Badge({ children, variant = 'discount', className = '' }: BadgeProps) {
  const variants = {
    discount: 'bg-primary text-white',
    stock: 'bg-green-600 text-white',
    category: 'bg-surface border border-primary/40 text-secondary',
    status: 'bg-primary/20 text-secondary border border-primary/30',
  }

  return (
    <span
      className={`font-mono text-xs font-bold px-2 py-0.5 uppercase tracking-wider ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  )
}
