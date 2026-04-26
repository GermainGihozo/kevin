import { useState } from 'react'
import { useAccount } from 'wagmi'
import Sidebar from './Sidebar'
import ContractStats from './ContractStats'
import ShipmentList from './ShipmentList'
import CreateShipment from './CreateShipment'
import SensorSimulator from './SensorSimulator'
import GasBudgetTracker from './GasBudgetTracker'
import { ChevronRight } from 'lucide-react'

export default function Dashboard() {
  const { address } = useAccount()
  const [tab, setTab] = useState('overview')
  const [refresh, setRefresh] = useState(0)

  const bump = () => setRefresh(r => r + 1)

  return (
    <div className="flex gap-0 lg:gap-6">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={tab} onTabChange={setTab} />

      {/* Main Content */}
      <main className="flex-1 min-w-0 w-full lg:w-auto p-4 lg:p-8 space-y-6 animate-fade-in">
        {/* Hero banner */}
        <div
          className="rounded-2xl border border-cyan-500/20 p-4 sm:p-6 shadow-xl shadow-black/20 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(8,145,178,0.18) 0%, rgba(15,23,42,1) 55%)',
          }}
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2306b6d4' fill-opacity='1'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />

          {/* Glow blob */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block flex-shrink-0" />
                <span className="truncate">Live Dashboard</span>
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-white break-words">
                Vaccine Shipment Tracker
              </h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Monitor cold-chain integrity
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-slate-500 mb-1">Wallet</p>
              <p className="font-mono text-xs text-cyan-300 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 backdrop-blur-sm truncate max-w-[150px]">
                {address?.slice(0, 6)}…{address?.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab content with responsive grid */}
        <div className="animate-slide-up" key={tab}>

        {tab === 'overview' && (
          <div className="space-y-6">
            <ContractStats refreshTrigger={refresh} />
            
            {/* Main grid - responsive 2 column on lg+ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
              {/* Left column - Recent Shipments (2/3 width on lg) */}
              <div className="lg:col-span-2">
                <div className="card h-full flex flex-col">
                  <div className="flex items-center justify-between mb-4 gap-2">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <span className="w-1 h-4 rounded-full bg-cyan-500 inline-block flex-shrink-0" />
                      <span className="truncate">Recent Shipments</span>
                    </h3>
                    <button
                      onClick={() => setTab('shipments')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors flex-shrink-0"
                    >
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-auto">
                    <ShipmentList limit={4} refreshTrigger={refresh} />
                  </div>
                </div>
              </div>

              {/* Right column - Stats & Actions (1/3 width on lg) */}
              <div className="space-y-4">
                {/* Gas Budget Card */}
                <div className="card">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <span className="w-1 h-4 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                    Gas Budget
                  </h3>
                  <GasBudgetTracker />
                </div>

                {/* Quick Action Card */}
                <div
                  className="card border-cyan-500/25 flex flex-col"
                  style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(15,23,42,1) 70%)' }}
                >
                  <p className="text-xs text-cyan-400 font-semibold uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    🌡️ Quick Action
                  </p>
                  <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                    Simulate sensor readings for temperature alerts
                  </p>
                  <button
                    onClick={() => setTab('simulator')}
                    className="btn-primary w-full"
                  >
                    Open Simulator
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'shipments' && (
          <div className="card">
            <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-cyan-500 inline-block flex-shrink-0" />
              All Shipments
            </h3>
            <ShipmentList refreshTrigger={refresh} />
          </div>
        )}

        {tab === 'create' && (
          <div className="w-full max-w-2xl">
            <div className="card">
              <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-purple-500 inline-block flex-shrink-0" />
                Create New Shipment
              </h3>
              <p className="text-sm text-slate-400 mb-6 ml-3">
                Register a new vaccine batch on-chain
              </p>
              <CreateShipment onShipmentCreated={bump} />
            </div>
          </div>
        )}

        {tab === 'simulator' && (
          <SensorSimulator onUpdate={bump} />
        )}

        {tab === 'gas' && (
          <div className="w-full max-w-2xl">
            <div className="card">
              <h3 className="font-semibold text-white mb-5 flex items-center gap-2">
                <span className="w-1 h-4 rounded-full bg-emerald-500 inline-block flex-shrink-0" />
                Gas Budget
              </h3>
              <GasBudgetTracker detailed />
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
