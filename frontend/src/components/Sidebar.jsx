import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import {
  LayoutDashboard, Package, PlusCircle,
  Thermometer, Wallet,
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'shipments', label: 'Shipments', icon: Package },
  { id: 'create', label: 'New Shipment', icon: PlusCircle },
  { id: 'simulator', label: 'Sensor Sim', icon: Thermometer },
  { id: 'gas', label: 'Gas Budget', icon: Wallet },
]

export default function Sidebar({ activeTab, onTabChange }) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTabChange = (tabId) => {
    onTabChange(tabId)
    setIsOpen(false) // Close mobile sidebar on tab click
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed bottom-6 right-6 z-50 p-3 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-600/40 hover:bg-purple-500 transition-all duration-200 active:scale-95"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 h-[calc(100dvh-64px)] w-64 bg-slate-900 border-r border-purple-800/30 p-4 overflow-y-auto transition-all duration-300 z-40
          lg:static lg:h-auto lg:border-r lg:border-purple-800/30 lg:p-6 lg:bg-transparent
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <nav className="space-y-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => handleTabChange(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-lg shadow-purple-600/10'
                  : 'text-slate-400 hover:text-slate-300 hover:bg-purple-900/20'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {/* Sidebar footer info */}
        <div className="mt-8 pt-6 border-t border-purple-800/20">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold mb-2">
            Status
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Live & Connected
          </div>
        </div>
      </aside>
    </>
  )
}
