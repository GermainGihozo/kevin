import { useBalance, useAccount } from 'wagmi'
import { Wallet, TrendingUp, AlertCircle, CheckCircle, Zap } from 'lucide-react'

const TRACKER_ADDRESSES = [
  import.meta.env.VITE_TRACKER1_ADDRESS,
  import.meta.env.VITE_TRACKER2_ADDRESS,
].filter(Boolean)

export default function GasBudgetTracker({ detailed = false }) {
  const { address } = useAccount()
  const { data: balance, isLoading } = useBalance({ address })

  const eth = balance ? parseFloat(balance.formatted) : 0
  const status = eth < 0.01 ? 'critical' : eth < 0.05 ? 'warning' : 'good'

  const statusConfig = {
    critical: { bar: 'bg-red-500',     text: 'text-red-400',     border: 'border-red-500/30',     label: 'Critical — top up now' },
    warning:  { bar: 'bg-yellow-400',  text: 'text-yellow-400',  border: 'border-yellow-500/30',  label: 'Low — consider topping up' },
    good:     { bar: 'bg-emerald-400', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Sufficient gas budget' },
  }
  const cfg = statusConfig[status]

  if (isLoading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-20 bg-slate-800 rounded-xl" />
        <div className="h-10 bg-slate-800 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main balance card */}
      <div className={`p-4 rounded-xl border ${cfg.border} bg-slate-900`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className={`w-4 h-4 ${cfg.text}`} />
            <span className="text-sm font-medium text-slate-300">Connected Wallet</span>
          </div>
          <div className="text-right">
            <p className={`text-xl font-bold font-mono ${cfg.text}`}>
              {eth.toFixed(4)} ETH
            </p>
            <p className="text-xs text-slate-600">≈ ${(eth * 2000).toFixed(2)} USD</p>
          </div>
        </div>

        {/* Balance bar */}
        <div className="gauge-track">
          <div
            className={`gauge-fill ${cfg.bar}`}
            style={{ width: `${Math.min(100, (eth / 0.1) * 100)}%` }}
          />
        </div>

        <div className="flex items-center gap-1.5 mt-2 text-xs">
          {status === 'good'
            ? <CheckCircle className={`w-3 h-3 ${cfg.text}`} />
            : <AlertCircle className={`w-3 h-3 ${cfg.text}`} />
          }
          <span className={cfg.text}>{cfg.label}</span>
        </div>
      </div>

      {/* Tracker wallets */}
      {detailed && TRACKER_ADDRESSES.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
            Tracker Wallets
          </p>
          <div className="space-y-2">
            {TRACKER_ADDRESSES.map((addr, i) => (
              <TrackerBalance key={addr} address={addr} index={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Gas cost table */}
      {detailed && (
        <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
            <TrendingUp className="w-3 h-3" /> Estimated Gas Costs
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['createShipment', '~334k'],
              ['updateStatus',   '~111k'],
              ['markDelivered',  '~60k' ],
              ['authorizeTracker','~46k'],
            ].map(([fn, gas]) => (
              <div key={fn} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
                <span className="text-slate-500 font-mono">{fn}</span>
                <span className="text-cyan-400 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3" />{gas}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function TrackerBalance({ address, index }) {
  const { data: balance, isLoading } = useBalance({ address })
  if (isLoading) return <div className="h-9 bg-slate-800 rounded-lg animate-pulse" />
  const eth = balance ? parseFloat(balance.formatted) : 0
  const low = eth < 0.01
  return (
    <div className="flex items-center justify-between px-3 py-2 bg-slate-800/60 border border-slate-700/40 rounded-lg text-xs">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${low ? 'bg-red-400' : 'bg-emerald-400'}`} />
        <span className="font-mono text-slate-500">
          Tracker {index}: {address.slice(0, 6)}…{address.slice(-4)}
        </span>
      </div>
      <span className={`font-semibold font-mono ${low ? 'text-red-400' : 'text-slate-300'}`}>
        {eth.toFixed(4)} ETH
      </span>
    </div>
  )
}
