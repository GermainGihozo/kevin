import { useState, useEffect, useRef, useCallback } from 'react'
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useReadContracts,
} from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import {
  Thermometer, Zap, MapPin, AlertTriangle, CheckCircle,
  Loader2, Play, Square, RefreshCw, TrendingUp, TrendingDown,
  Minus, Package, ChevronDown, ChevronUp,
} from 'lucide-react'

// ─── constants ────────────────────────────────────────────────────────────────
const LOCATIONS = [
  'Cold Storage A', 'Cold Storage B', 'Transit Hub – JFK',
  'Transit Hub – LAX', 'Distribution Center', 'Last-Mile Van #7',
  'Airport Cargo Bay', 'Refrigerated Truck #12', 'Pharmacy Depot',
]
const DISPLAY_MIN = -85
const DISPLAY_MAX = 15
const STATUS_LABELS = ['Created', 'In Transit', 'Breach', 'Delivered', 'Reverted']

// ─── helpers ──────────────────────────────────────────────────────────────────
const tempToContract  = (c) => Math.round(c * 100)
const contractToDisp  = (raw) => Number(raw) / 100
const fmtTemp         = (c) => `${c > 0 ? '+' : ''}${c.toFixed(1)} °C`
const tempColor       = (c) => c < -80 || c > 8 ? 'text-red-400' : c < -70 || c > 6 ? 'text-yellow-400' : 'text-emerald-400'
const gaugePercent    = (c) => Math.max(0, Math.min(100, ((c - DISPLAY_MIN) / (DISPLAY_MAX - DISPLAY_MIN)) * 100))
const gaugeColor      = (c) => c < -80 || c > 8 ? 'bg-red-500' : c < -70 || c > 6 ? 'bg-yellow-400' : 'bg-emerald-400'

// ─── ShipmentPicker ───────────────────────────────────────────────────────────
function ShipmentPicker({ selectedId, onSelect }) {
  const [open, setOpen] = useState(false)

  // Load total count
  const { data: stats } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getContractStats',
    query: { refetchInterval: 5_000 },
  })

  const total = stats ? Number(stats[2]) - 1 : 0
  const ids   = Array.from({ length: total }, (_, i) => i + 1)

  // Batch-load all shipments
  const { data: shipmentsData, isLoading } = useReadContracts({
    contracts: ids.map(id => ({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'getShipment',
      args: [BigInt(id)],
    })),
    query: { enabled: ids.length > 0 },
  })

  const shipments = (shipmentsData || []).map(r => r.result).filter(Boolean)
  const selected  = shipments.find(s => Number(s.id) === selectedId)

  const statusDot = (status) => {
    const n = Number(status)
    if (n === 1) return 'bg-cyan-400 animate-pulse'
    if (n === 2 || n === 4) return 'bg-red-400'
    if (n === 3) return 'bg-emerald-400'
    return 'bg-slate-600'
  }

  const canSimulate = (s) => {
    const n = Number(s.status)
    return n === 0 || n === 1   // Created or In Transit
  }

  return (
    <div className="relative">
      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
        Select Shipment
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="input flex items-center justify-between w-full text-left"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(selected.status)}`} />
            <span className="font-semibold text-white">#{selected.id.toString()}</span>
            <span className="text-slate-400 truncate">— {selected.batchNumber}</span>
          </div>
        ) : (
          <span className="text-slate-500">Choose a shipment…</span>
        )}
        {open
          ? <ChevronUp className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
          : <ChevronDown className="w-4 h-4 text-slate-500 shrink-0 ml-2" />
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-fade-in">
          {isLoading ? (
            <div className="p-4 text-xs text-slate-500 text-center">Loading shipments…</div>
          ) : shipments.length === 0 ? (
            <div className="p-4 text-xs text-slate-500 text-center">
              No shipments found — create one first
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-slate-800">
              {shipments.map(s => {
                const active = canSimulate(s)
                const isSelected = Number(s.id) === selectedId
                return (
                  <button
                    key={s.id.toString()}
                    type="button"
                    disabled={!active}
                    onClick={() => { onSelect(Number(s.id)); setOpen(false) }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors
                      ${isSelected ? 'bg-cyan-500/10' : 'hover:bg-slate-800'}
                      ${!active ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${statusDot(s.status)}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">
                          #{s.id.toString()}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          {s.batchNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>{STATUS_LABELS[Number(s.status)] ?? '?'}</span>
                        {Number(s.currentTemperature) !== 0 && (
                          <span className={tempColor(contractToDisp(s.currentTemperature))}>
                            {fmtTemp(contractToDisp(s.currentTemperature))}
                          </span>
                        )}
                        <span className="truncate">{s.location}</span>
                      </div>
                    </div>
                    {!active && (
                      <span className="text-xs text-slate-600 shrink-0">
                        {Number(s.status) === 3 ? 'Delivered' : 'Reverted'}
                      </span>
                    )}
                    {isSelected && (
                      <CheckCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected shipment info card */}
      {selected && (
        <div className="mt-3 p-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-xs space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Batch</span>
            <span className="text-cyan-300 font-semibold">{selected.batchNumber}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Status</span>
            <span className="text-slate-300">{STATUS_LABELS[Number(selected.status)] ?? '?'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Current temp</span>
            <span className={`font-mono font-semibold ${
              Number(selected.currentTemperature) !== 0
                ? tempColor(contractToDisp(selected.currentTemperature))
                : 'text-slate-500'
            }`}>
              {Number(selected.currentTemperature) !== 0
                ? fmtTemp(contractToDisp(selected.currentTemperature))
                : '—'
              }
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Location</span>
            <span className="text-slate-300 truncate max-w-[160px]">{selected.location || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Tracker</span>
            <span className="font-mono text-slate-400">
              {selected.tracker.slice(0, 6)}…{selected.tracker.slice(-4)}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main SensorSimulator ─────────────────────────────────────────────────────
export default function SensorSimulator({ onUpdate }) {
  const [selectedId, setSelectedId]     = useState(null)
  const [temperature, setTemperature]   = useState(-5)
  const [location, setLocation]         = useState(LOCATIONS[0])
  const [customLocation, setCustomLoc]  = useState('')
  const [useCustomLoc, setUseCustomLoc] = useState(false)
  const [history, setHistory]           = useState([])
  const [autoMode, setAutoMode]         = useState(false)
  const autoRef = useRef(null)

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  // Read the selected shipment live
  const { data: shipmentData, refetch: refetchShipment } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getShipment',
    args: selectedId ? [BigInt(selectedId)] : undefined,
    query: { enabled: selectedId !== null, refetchInterval: 4_000 },
  })

  const currentOnChain = shipmentData ? contractToDisp(shipmentData.currentTemperature) : null
  const isBreach = temperature < -80 || temperature > 8
  const busy     = isPending || isConfirming

  // Send reading to chain
  const sendReading = useCallback(() => {
    if (!selectedId || isPending || isConfirming) return
    const loc = useCustomLoc ? (customLocation.trim() || 'Unknown') : location
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'updateStatus',
      args: [BigInt(selectedId), tempToContract(temperature), loc],
      gas: 300_000n,
    })
  }, [selectedId, isPending, isConfirming, useCustomLoc, customLocation, location, temperature, writeContract])

  // On success
  useEffect(() => {
    if (!isSuccess) return
    const loc = useCustomLoc ? customLocation : location
    setHistory(prev => [{
      id: Date.now(),
      shipmentId: selectedId,
      temp: temperature,
      loc,
      time: new Date().toLocaleTimeString(),
      breach: temperature < -80 || temperature > 8,
    }, ...prev.slice(0, 19)])
    onUpdate?.()
    refetchShipment()
    reset()
  }, [isSuccess]) // eslint-disable-line

  // Auto-mode drift
  useEffect(() => {
    if (!autoMode) { clearInterval(autoRef.current); return }
    autoRef.current = setInterval(() => {
      setTemperature(prev =>
        parseFloat(Math.max(DISPLAY_MIN, Math.min(DISPLAY_MAX, prev + (Math.random() - 0.5) * 2)).toFixed(1))
      )
    }, 1500)
    return () => clearInterval(autoRef.current)
  }, [autoMode])

  // Auto-submit on drift
  const prevTemp = useRef(temperature)
  useEffect(() => {
    if (!autoMode || isPending || isConfirming || !selectedId) return
    if (Math.abs(temperature - prevTemp.current) < 0.5) return
    prevTemp.current = temperature
    sendReading()
  }, [temperature, autoMode, sendReading, selectedId])

  const currentLoc = useCustomLoc ? customLocation : location

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="text-lg font-bold text-white">Sensor Simulator</h3>
          <p className="text-sm text-slate-400">
            Select a shipment, set the temperature, and send it on-chain
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAutoMode(a => !a)}
          disabled={!selectedId}
          className={autoMode ? 'btn-danger' : 'btn-ghost'}
        >
          {autoMode
            ? <><Square className="w-4 h-4" /> Stop Auto</>
            : <><Play className="w-4 h-4" /> Auto Mode</>
          }
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Left: Controls ── */}
        <div className="card space-y-6">

          {/* 1. Shipment picker */}
          <ShipmentPicker selectedId={selectedId} onSelect={setSelectedId} />

          {/* 2. Temperature slider */}
          <div className={selectedId ? '' : 'opacity-40 pointer-events-none'}>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Temperature
              </label>
              <span className={`text-2xl font-bold font-mono tabular-nums ${tempColor(temperature)}`}>
                {fmtTemp(temperature)}
              </span>
            </div>

            {/* Gauge */}
            <div className="h-3 rounded-full bg-slate-800 overflow-hidden mb-3 relative">
              <div
                className="absolute top-0 h-full bg-emerald-500/20 border-x border-emerald-500/30"
                style={{
                  left: `${gaugePercent(-80)}%`,
                  width: `${gaugePercent(8) - gaugePercent(-80)}%`,
                }}
              />
              <div
                className={`h-full rounded-full transition-all duration-500 ${gaugeColor(temperature)}`}
                style={{ width: `${gaugePercent(temperature)}%` }}
              />
            </div>

            <input
              type="range"
              min={DISPLAY_MIN} max={DISPLAY_MAX} step="0.1"
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value))}
              className="w-full cursor-pointer"
              disabled={autoMode}
            />

            <div className="flex justify-between text-xs text-slate-600 mt-1">
              <span>{DISPLAY_MIN} °C</span>
              <span className="text-emerald-600/70">Safe: −80 to +8 °C</span>
              <span>{DISPLAY_MAX} °C</span>
            </div>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mt-3">
              {[
                { label: '−70 °C', val: -70, safe: true  },
                { label: '−5 °C',  val: -5,  safe: true  },
                { label: '+4 °C',  val: 4,   safe: true  },
                { label: '+10 °C', val: 10,  safe: false },
                { label: '−85 °C', val: -85, safe: false },
              ].map(p => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setTemperature(p.val)}
                  disabled={autoMode}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40 ${
                    p.safe
                      ? 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/60'
                      : 'bg-red-900/50 text-red-300 hover:bg-red-800/60'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Location */}
          <div className={selectedId ? '' : 'opacity-40 pointer-events-none'}>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Location
            </label>
            <div className="flex gap-2 mb-2">
              {['Preset', 'Custom'].map((lbl, i) => (
                <button
                  key={lbl}
                  type="button"
                  onClick={() => setUseCustomLoc(i === 1)}
                  className={`text-xs px-3 py-1 rounded-lg transition-colors ${
                    useCustomLoc === (i === 1)
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            {useCustomLoc ? (
              <input
                type="text"
                value={customLocation}
                onChange={e => setCustomLoc(e.target.value)}
                placeholder="e.g., Warehouse B – Dock 3"
                className="input"
              />
            ) : (
              <select
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="input"
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            )}
          </div>

          {/* Breach warning */}
          {isBreach && selectedId && (
            <div className="flex items-start gap-3 p-4 bg-red-950/60 border border-red-500/40 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300">Temperature Breach Warning</p>
                <p className="text-xs text-red-400/80 mt-0.5">
                  Sending this reading will trigger an on-chain alert and automatically revert the shipment.
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-500/30 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error.shortMessage || error.message}</p>
            </div>
          )}

          {/* No shipment selected hint */}
          {!selectedId && (
            <div className="flex items-center gap-2 p-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-slate-500">
              <Package className="w-4 h-4 shrink-0" />
              Select a shipment above to enable the simulator
            </div>
          )}

          {/* Submit */}
          <button
            type="button"
            onClick={sendReading}
            disabled={busy || autoMode || !selectedId}
            className={`w-full ${isBreach ? 'btn-danger' : 'btn-primary'}`}
          >
            {busy ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{isConfirming ? 'Confirming…' : 'Sending…'}</>
            ) : (
              <><Zap className="w-4 h-4" />Send Reading to Chain</>
            )}
          </button>

          {autoMode && (
            <p className="text-center text-xs text-cyan-400 animate-pulse">
              ⚡ Auto mode active — readings sent automatically
            </p>
          )}
        </div>

        {/* ── Right: Live display + history ── */}
        <div className="space-y-4">

          {/* Thermometer card */}
          <div className="card text-center">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">
              {selectedId ? `Shipment #${selectedId} — Simulated Reading` : 'No Shipment Selected'}
            </p>

            {/* Visual thermometer */}
            <div className="relative inline-flex flex-col items-center mb-4">
              <div className="w-12 h-40 bg-slate-800 rounded-full border border-slate-700 relative overflow-hidden flex flex-col justify-end">
                <div
                  className={`w-full transition-all duration-500 ${gaugeColor(temperature)}`}
                  style={{ height: `${gaugePercent(temperature)}%` }}
                />
              </div>
              <div className={`w-8 h-8 rounded-full border-4 border-slate-700 mt-1 ${gaugeColor(temperature)}`} />
              <Thermometer className="absolute top-2 text-slate-600 w-5 h-5 pointer-events-none" />
            </div>

            <p className={`text-4xl font-bold font-mono tabular-nums ${tempColor(temperature)}`}>
              {fmtTemp(temperature)}
            </p>
            <p className="text-xs text-slate-500 mt-1 flex items-center justify-center gap-1">
              <MapPin className="w-3 h-3" /> {currentLoc || '—'}
            </p>

            {isBreach ? (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-red-900/50 border border-red-500/40 rounded-full text-xs text-red-300 font-semibold">
                <AlertTriangle className="w-3 h-3" /> BREACH
              </div>
            ) : (
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-900/50 border border-emerald-500/40 rounded-full text-xs text-emerald-300 font-semibold">
                <CheckCircle className="w-3 h-3" /> SAFE
              </div>
            )}

            {/* On-chain comparison */}
            {currentOnChain !== null && Number(shipmentData?.currentTemperature) !== 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-center gap-3 text-xs text-slate-500">
                <span>
                  On-chain:{' '}
                  <span className={`font-semibold ${tempColor(currentOnChain)}`}>
                    {fmtTemp(currentOnChain)}
                  </span>
                </span>
                {temperature > currentOnChain + 0.5 && <TrendingUp className="w-3 h-3 text-red-400" />}
                {temperature < currentOnChain - 0.5 && <TrendingDown className="w-3 h-3 text-blue-400" />}
                {Math.abs(temperature - currentOnChain) <= 0.5 && <Minus className="w-3 h-3 text-slate-500" />}
              </div>
            )}
          </div>

          {/* Reading history */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                Reading History
              </p>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={() => setHistory([])}
                  className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-600 text-center py-6">
                No readings sent yet
              </p>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {history.map(h => (
                  <div
                    key={h.id}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                      h.breach
                        ? 'bg-red-950/50 border border-red-500/20'
                        : 'bg-slate-800/60 border border-slate-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {h.breach
                        ? <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                        : <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                      }
                      <span className="text-slate-600 shrink-0">#{h.shipmentId}</span>
                      <span className={`font-mono font-semibold shrink-0 ${h.breach ? 'text-red-300' : 'text-emerald-300'}`}>
                        {fmtTemp(h.temp)}
                      </span>
                      <span className="text-slate-500 truncate">{h.loc}</span>
                    </div>
                    <span className="text-slate-600 shrink-0 ml-2">{h.time}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
