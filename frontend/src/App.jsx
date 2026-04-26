import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import Dashboard from './components/Dashboard'
import TemperatureAlertOverlay from './components/TemperatureAlertOverlay'
import { useTemperatureAlerts } from './hooks/useTemperatureAlerts'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { Activity, Moon, Sun } from 'lucide-react'

function AppContent() {
  const { isConnected } = useAccount()
  const { alerts, dismissAlert } = useTemperatureAlerts()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 transition-colors duration-300">

      {/* Alert overlay */}
      {alerts.length > 0 && (
        <TemperatureAlertOverlay alerts={alerts} onDismiss={dismissAlert} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50/80 backdrop-blur-md transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/20 border border-purple-500/40 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Activity className="w-4 h-4 text-purple-400" />
              </div>
              {/* Pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight tracking-wide text-gradient-cyan">
                Blockchain Temperature Based Vaccine Logistics
              </h1>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                Blockchain vaccine logistics · Hardhat Local
              </p>
            </div>
          </div>

          {/* Right section with theme toggle and connect button */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-all duration-200 hover:bg-purple-500/20 active:scale-95"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-purple-400" />
              ) : (
                <Moon className="w-5 h-5 text-purple-600" />
              )}
            </button>
            <ConnectButton />
          </div>
        </div>
        {/* Gradient accent line */}
        <div className="header-line" />
      </header>

      {/* Main Content Area with Sidebar Layout */}
      <main className="lg:flex">
        {isConnected ? (
          <Dashboard />
        ) : (
          <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
            <LandingScreen />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200/60 mt-16 py-6 text-center text-xs text-slate-600 dark:text-slate-600 light:text-slate-500 transition-colors duration-300">
        <span className="text-gradient-cyan font-semibold">blockchain temperature based Vaccine Logistics</span>
        &nbsp;—&nbsp;blockchain temperature-based vaccine logistics&nbsp;·&nbsp;Hardhat Local (chain 31337)
      </footer>
    </div>
  )
}

function LandingScreen() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">

      {/* Hero icon with glow rings */}
      <div className="relative mb-10">
        {/* Outer glow ring */}
        <div className="absolute inset-0 rounded-3xl bg-purple-500/10 blur-2xl scale-150" />
        {/* Middle ring */}
        <div className="absolute -inset-3 rounded-3xl border border-purple-500/10 animate-ping-slow" />
        {/* Icon box */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/30 flex items-center justify-center shadow-2xl shadow-purple-500/10">
          <span className="text-5xl select-none">🧬</span>
        </div>
        {/* Live dot */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-950 shadow-lg shadow-emerald-400/40 animate-pulse" />
      </div>

      <h2 className="text-5xl font-bold mb-3 text-gradient-cyan">blockchain temperature based Vaccine Logistics</h2>
      <p className="text-slate-400 mb-2 max-w-md leading-relaxed">
        Blockchain temperature-based vaccine logistics. Temperature breaches trigger automatic on-chain reversion.
      </p>
      <p className="text-slate-500 text-sm mb-10">Connect your wallet to access the dashboard.</p>

      <ConnectButton />

      {/* Setup card */}
      <div className="mt-10 card max-w-sm text-left animate-slide-up border-purple-700/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1.5 h-4 rounded-full bg-purple-500" />
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest">
            MetaMask Setup
          </p>
        </div>
        <ol className="space-y-3 text-sm text-slate-400">
          {[
            <>MetaMask → <em className="text-slate-300">Add a network manually</em></>,
            <>RPC URL: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300 text-xs ml-1">http://127.0.0.1:8545</code></>,
            <>Chain ID: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300 text-xs ml-1">31337</code></>,
            <>Import a Hardhat private key from the node output</>,
          ].map((item, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  )
}

export default App
