import { useState, useEffect } from 'react'
import { useReadContract, useReadContracts } from 'wagmi'
import { Package, Thermometer, MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { CONTRACT_ADDRESS, CONTRACT_ABI, STATUS_LABELS } from '../config/contract'

const BADGE = {
  0: 'badge-created',
  1: 'badge-transit',
  2: 'badge-breach',
  3: 'badge-delivered',
  4: 'badge-reverted',
}

function formatTemp(raw) {
  const v = Number(raw) / 100
  return `${v > 0 ? '+' : ''}${v.toFixed(1)} °C`
}

function formatTime(ts) {
  return new Date(Number(ts) * 1000).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Solidity type(int256).max and type(int256).min as BigInt
const INT256_MAX = BigInt('57896044618658097711785492504343953926634992332820282019728792003956564819967')
const INT256_MIN = BigInt('-57896044618658097711785492504343953926634992332820282019728792003956564819968')

function ShipmentRow({ s }) {
  const [open, setOpen] = useState(false)
  const status = Number(s.status)
  const isBreach = status === 2 || status === 4

  // Bug fix: compare against actual int256 max/min, not hex literals
  const hasMinTemp = s.minTemperature !== INT256_MAX
  const hasMaxTemp = s.maxTemperature !== INT256_MIN

  return (
    <div className={`relative rounded-xl border transition-all duration-200 overflow-hidden ${
      isBreach ? 'border-red-500/30 bg-red-950/20' : 'border-slate-800 bg-slate-900/60'
    }`}>
      {/* Left accent stripe */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl ${
        status === 1 ? 'bg-cyan-500' :
        isBreach    ? 'bg-red-500'   :
        status === 3 ? 'bg-emerald-500' : 'bg-slate-700'
      }`} style={{ position: 'absolute' }} />
      {/* Summary row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            status === 1 ? 'bg-cyan-400 animate-pulse' :
            isBreach    ? 'bg-red-400 animate-pulse'  :
            status === 3 ? 'bg-emerald-400'            : 'bg-slate-600'
          }`} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">
              #{s.id.toString()} — {s.batchNumber}
            </p>
            <p className="text-xs text-slate-500 truncate">{s.location || '—'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <span className={BADGE[status] ?? 'badge'}>
            {STATUS_LABELS[status] ?? 'Unknown'}
          </span>
          {open
            ? <ChevronUp className="w-4 h-4 text-slate-500" />
            : <ChevronDown className="w-4 h-4 text-slate-500" />
          }
        </div>
      </button>

      {/* Expanded detail */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3 animate-fade-in">
          <Detail
            icon={Thermometer}
            label="Current Temp"
            value={Number(s.currentTemperature) !== 0 ? formatTemp(s.currentTemperature) : '—'}
            accent={isBreach ? 'text-red-400' : 'text-emerald-400'}
          />
          <Detail icon={MapPin}  label="Location"    value={s.location || '—'} />
          <Detail icon={Clock}   label="Last Update" value={formatTime(s.lastUpdate)} />
          <Detail
            icon={Thermometer}
            label="Min Temp"
            value={hasMinTemp ? formatTemp(s.minTemperature) : '—'}
          />
          <Detail
            icon={Thermometer}
            label="Max Temp"
            value={hasMaxTemp ? formatTemp(s.maxTemperature) : '—'}
          />
          <Detail
            icon={Package}
            label="Tracker"
            value={`${s.tracker.slice(0, 6)}…${s.tracker.slice(-4)}`}
            mono
          />

          {isBreach && (
            <div className="col-span-full mt-1 p-2 bg-red-950/50 border border-red-500/20 rounded-lg text-xs text-red-300">
              ⚠ Temperature breach — shipment automatically reverted on-chain
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Detail({ icon: Icon, label, value, accent = 'text-slate-300', mono = false }) {
  return (
    <div>
      <p className="text-xs text-slate-600 flex items-center gap-1 mb-0.5">
        <Icon className="w-3 h-3" /> {label}
      </p>
      <p className={`text-sm font-medium ${accent} ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

export default function ShipmentList({ limit, refreshTrigger }) {
  const [shipmentIds, setShipmentIds] = useState([])

  const { data: stats, refetch: refetchStats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractStats',
    query: { refetchInterval: 5_000 },
  })

  useEffect(() => {
    if (!stats) return
    const total = Number(stats[2]) - 1   // nextShipmentId - 1 = highest existing id
    const count = limit ? Math.min(limit, total) : total
    setShipmentIds(Array.from({ length: count }, (_, i) => i + 1))
  }, [stats, limit, refreshTrigger])

  useEffect(() => { refetchStats() }, [refreshTrigger]) // eslint-disable-line

  const { data: shipmentsData, isLoading } = useReadContracts({
    contracts: shipmentIds.map(id => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getShipment',
      args: [BigInt(id)],
    })),
    query: { enabled: shipmentIds.length > 0 },
  })

  const shipments = (shipmentsData || []).map(r => r.result).filter(Boolean).reverse()

  if (isLoading && shipmentIds.length > 0) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-14 shimmer rounded-xl" />
        ))}
      </div>
    )
  }

  if (shipments.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-10 h-10 mx-auto mb-3 text-slate-700" />
        <p className="font-medium text-slate-500">No shipments yet</p>
        <p className="text-sm text-slate-600 mt-1">Create your first shipment to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {shipments.map(s => <ShipmentRow key={s.id.toString()} s={s} />)}
      {limit && shipments.length >= limit && (
        <p className="text-center text-xs text-cyan-500 pt-2 cursor-pointer hover:text-cyan-400 transition-colors">
          View all shipments →
        </p>
      )}
    </div>
  )
}
