import { X, ShieldAlert } from 'lucide-react'

function formatTemp(raw) {
  const v = raw / 100
  return `${v > 0 ? '+' : ''}${v.toFixed(1)} °C`
}

export default function TemperatureAlertOverlay({ alerts, onDismiss }) {
  if (!alerts?.length) return null

  const alert = alerts[0]
  const isHigh = alert.alertType === 'CRITICAL_HIGH'

  const accent = isHigh ? 'red' : 'blue'
  const accentClasses = {
    border:  isHigh ? 'border-red-500/60'  : 'border-blue-500/60',
    stripe:  isHigh ? 'bg-red-500'         : 'bg-blue-500',
    iconBg:  isHigh ? 'bg-red-500/15 border-red-500/30'   : 'bg-blue-500/15 border-blue-500/30',
    icon:    isHigh ? 'text-red-400'        : 'text-blue-400',
    label:   isHigh ? 'text-red-500'        : 'text-blue-500',
    btn:     isHigh ? 'bg-red-500 hover:bg-red-400'   : 'bg-blue-500 hover:bg-blue-400',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
      style={{ background: 'rgba(15,23,42,0.92)', backdropFilter: 'blur(8px)' }}
      role="alertdialog"
      aria-modal="true"
      aria-label="Temperature breach alert"
    >
      <div className="relative w-full max-w-md mx-4">

        {/* Card */}
        <div className={`rounded-2xl border-2 overflow-hidden shadow-2xl bg-slate-950 ${accentClasses.border}`}>

          {/* Top colour stripe */}
          <div className={`h-1.5 w-full ${accentClasses.stripe}`} />

          <div className="p-8 text-center">

            {/* Icon */}
            <div className={`w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center border ${accentClasses.iconBg}`}>
              <ShieldAlert className={`w-10 h-10 ${accentClasses.icon}`} />
            </div>

            {/* Labels */}
            <p className={`text-xs font-bold uppercase tracking-widest mb-2 ${accentClasses.label}`}>
              {isHigh ? '🔥 Critical High Temperature' : '🧊 Critical Low Temperature'}
            </p>
            <h2 className="text-2xl font-bold text-white mb-1">Temperature Breach</h2>
            <p className="text-slate-400 text-sm mb-6">
              Shipment #{alert.shipmentId} has been automatically reverted
            </p>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <StatBox label="Detected"  value={formatTemp(alert.temperature)} accent={accentClasses.icon} />
              <StatBox label="Threshold" value={formatTemp(alert.threshold)}   accent="text-slate-300" />
              <StatBox label="Time"      value={new Date(alert.timestamp * 1000).toLocaleTimeString()} accent="text-slate-300" />
            </div>

            {/* Pending count */}
            {alerts.length > 1 && (
              <p className="text-xs text-slate-500 mb-4">
                +{alerts.length - 1} more alert{alerts.length > 2 ? 's' : ''} pending
              </p>
            )}

            {/* Acknowledge */}
            <button
              onClick={() => onDismiss(alert.id)}
              className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-colors ${accentClasses.btn}`}
            >
              Acknowledge Alert
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={() => onDismiss(alert.id)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function StatBox({ label, value, accent }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
      <p className="text-xs text-slate-600 mb-1">{label}</p>
      <p className={`text-sm font-bold font-mono ${accent}`}>{value}</p>
    </div>
  )
}
