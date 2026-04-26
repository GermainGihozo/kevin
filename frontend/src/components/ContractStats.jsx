import { useReadContract } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import { Package, Activity, CheckCircle, Hash } from 'lucide-react'

export default function ContractStats({ refreshTrigger }) {
  const { data: stats, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractStats',
    query: { refetchInterval: 5_000, staleTime: 3_000 },
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <div className="h-3 shimmer rounded w-2/3 mb-3" />
            <div className="h-8 shimmer rounded w-1/2" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-500/30 bg-red-950/20 text-red-400 text-sm flex items-center gap-2">
        <span className="text-base">⚠</span>
        Could not load contract stats — is the Hardhat node running?
      </div>
    )
  }

  const total     = stats ? Number(stats[0]) : 0
  const active    = stats ? Number(stats[1]) : 0
  const nextId    = stats ? Number(stats[2]) : 1
  const completed = total - active

  const cards = [
    {
      label: 'Total Shipments',
      value: total,
      icon: Package,
      accent:  'text-cyan-400',
      topBar:  'bg-cyan-500',
      border:  'border-cyan-500/20',
      glow:    'shadow-cyan-500/5',
    },
    {
      label: 'Active',
      value: active,
      icon: Activity,
      accent:  'text-emerald-400',
      topBar:  'bg-emerald-500',
      border:  'border-emerald-500/20',
      glow:    'shadow-emerald-500/5',
    },
    {
      label: 'Completed',
      value: completed,
      icon: CheckCircle,
      accent:  'text-purple-400',
      topBar:  'bg-purple-500',
      border:  'border-purple-500/20',
      glow:    'shadow-purple-500/5',
    },
    {
      label: 'Next ID',
      value: nextId,
      icon: Hash,
      accent:  'text-slate-400',
      topBar:  'bg-slate-600',
      border:  'border-slate-700',
      glow:    '',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, accent, topBar, border, glow }) => (
        <div key={label} className={`stat-card shadow-lg ${glow} border ${border}`}>
          {/* Thin top accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl ${topBar} opacity-70`} />

          <div className="flex items-start justify-between pt-1">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">{label}</p>
            <Icon className={`w-4 h-4 ${accent} opacity-50`} />
          </div>
          <p className={`text-3xl font-bold mt-2 ${accent}`}>{value}</p>
        </div>
      ))}
    </div>
  )
}
