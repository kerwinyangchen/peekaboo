import { cn } from '../lib/utils'
import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react'

const variants = {
  pass: {
    className: 'bg-[#EAF4EE] border border-[#A8D5B8] text-[#155230]',
    Icon: CheckCircle,
    label: 'Pass',
  },
  warning: {
    className: 'bg-[#FDF8EE] border border-[#E8D5A0] text-[#7A5E1A]',
    Icon: AlertTriangle,
    label: 'Warning',
  },
  critical: {
    className: 'bg-[#FEF0F1] border border-[#F5B5BB] text-[#A80015]',
    Icon: XCircle,
    label: 'Critical',
  },
  fail: {
    className: 'bg-[#FEF0F1] border border-[#F5B5BB] text-[#A80015]',
    Icon: XCircle,
    label: 'Fail',
  },
  info: {
    className: 'bg-[#EEF3FE] border border-[#BFCFFE] text-[#1D4ED8]',
    Icon: Info,
    label: 'Info',
  },
}

export function Badge({ variant = 'info', label, showIcon = true, size = 'sm', className }) {
  const v = variants[variant] || variants.info
  const Icon = v.Icon
  const displayLabel = label ?? v.label

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-sm',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        v.className,
        className
      )}
    >
      {showIcon && <Icon size={size === 'sm' ? 11 : 14} aria-hidden="true" />}
      {displayLabel}
    </span>
  )
}

export function StatusBadge({ status, ...props }) {
  const map = { pass: 'pass', fail: 'fail', warning: 'warning', critical: 'critical' }
  return <Badge variant={map[status] || 'info'} {...props} />
}
