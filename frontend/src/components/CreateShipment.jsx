import { useState, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'
import { Package, Loader2, CheckCircle, AlertCircle, Copy } from 'lucide-react'

const TRACKER1 = import.meta.env.VITE_TRACKER1_ADDRESS || ''
const TRACKER2 = import.meta.env.VITE_TRACKER2_ADDRESS || ''

export default function CreateShipment({ onShipmentCreated }) {
  const [batchNumber, setBatchNumber]       = useState('')
  const [trackerAddress, setTrackerAddress] = useState('')
  const [submitted, setSubmitted]           = useState(false)

  const { writeContract, data: hash, error, isPending, reset } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    if (!isSuccess) return
    setBatchNumber('')
    setTrackerAddress('')
    setSubmitted(false)
    onShipmentCreated?.()
    reset()
  }, [isSuccess]) // eslint-disable-line

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!batchNumber.trim() || !trackerAddress.trim()) return
    setSubmitted(true)
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createShipment',
      args: [batchNumber.trim(), trackerAddress.trim()],
      gas: 500_000n,   // well above actual ~334k, well below MetaMask's 16.7M cap
    })
  }

  const busy = isPending || isConfirming

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Batch Number */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Batch Number
          </label>
          <input
            type="text"
            value={batchNumber}
            onChange={e => setBatchNumber(e.target.value)}
            placeholder="e.g., BATCH-002"
            disabled={busy}
            className="input"
          />
        </div>

        {/* Tracker Address */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">
            Tracker Device Address
          </label>
          <input
            type="text"
            value={trackerAddress}
            onChange={e => setTrackerAddress(e.target.value)}
            placeholder="0x..."
            disabled={busy}
            className="input font-mono"
          />

          {/* Quick-fill authorized trackers */}
          {(TRACKER1 || TRACKER2) && (
            <div className="mt-2 space-y-1">
              <p className="text-xs text-slate-600">Authorized trackers (from deployment):</p>
              {[TRACKER1, TRACKER2].filter(Boolean).map((addr, i) => (
                <button
                  key={addr}
                  type="button"
                  onClick={() => setTrackerAddress(addr)}
                  className="flex items-center gap-2 w-full px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  <Copy className="w-3 h-3 shrink-0" />
                  <span className="font-mono truncate">Tracker {i + 1}: {addr}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {error && submitted && (
          <div className="flex items-start gap-2 p-3 bg-red-950/50 border border-red-500/30 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{error.shortMessage || error.message}</p>
          </div>
        )}

        {/* Success */}
        {isSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-950/50 border border-emerald-500/30 rounded-xl">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">Shipment created successfully!</p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy || !batchNumber.trim() || !trackerAddress.trim()}
          className="btn-primary w-full"
        >
          {busy ? (
            <><Loader2 className="w-4 h-4 animate-spin" />{isConfirming ? 'Confirming on chain…' : 'Sending…'}</>
          ) : (
            <><Package className="w-4 h-4" />Create Shipment</>
          )}
        </button>
      </form>

      {/* Info */}
      <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl text-xs text-slate-400 space-y-1.5">
        <p className="font-semibold text-slate-300 mb-2">Temperature Safety Limits</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          Safe range: −80 °C to +8 °C
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
          Breach → automatic on-chain reversion + alert overlay
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
          Use the Sensor Simulator tab to send temperature readings
        </div>
      </div>
    </div>
  )
}
