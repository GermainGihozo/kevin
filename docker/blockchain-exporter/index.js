const express  = require('express')
const client   = require('prom-client')
const { ethers } = require('ethers')

const app             = express()
const PORT            = parseInt(process.env.EXPORTER_PORT || '8080', 10)
const RPC_URL         = process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545'
const CONTRACT_ADDR   = process.env.CONTRACT_ADDRESS || ''
const SCRAPE_INTERVAL = parseInt(process.env.SCRAPE_INTERVAL_MS || '15000', 10)

// ── Prometheus registry ───────────────────────────────────────────────────────
const register = new client.Registry()
register.setDefaultLabels({ app: 'vaccine-shipment-tracker' })
client.collectDefaultMetrics({ register })

// ── Custom metrics ────────────────────────────────────────────────────────────
const mBlockHeight = new client.Gauge({
  name: 'blockchain_block_height',
  help: 'Latest block number',
  registers: [register],
})

const mBlockTime = new client.Gauge({
  name: 'blockchain_block_time_seconds',
  help: 'Seconds between the two most recent blocks',
  registers: [register],
})

const mGasPrice = new client.Gauge({
  name: 'blockchain_gas_price_gwei',
  help: 'Current gas price in Gwei',
  registers: [register],
})

const mTotalShipments = new client.Gauge({
  name: 'shipment_tracker_total_shipments',
  help: 'Total shipments ever created',
  registers: [register],
})

const mActiveShipments = new client.Gauge({
  name: 'shipment_tracker_active_shipments',
  help: 'Currently active shipments',
  registers: [register],
})

const mTempAlerts = new client.Counter({
  name: 'shipment_tracker_temperature_alerts_total',
  help: 'Total temperature breach alerts emitted',
  labelNames: ['alert_type'],
  registers: [register],
})

const mReverted = new client.Counter({
  name: 'shipment_tracker_reverted_shipments_total',
  help: 'Total shipments reverted due to temperature breach',
  labelNames: ['reason'],
  registers: [register],
})

const mScrapeErrors = new client.Counter({
  name: 'exporter_scrape_errors_total',
  help: 'Total number of scrape errors',
  registers: [register],
})

// ── Contract ABI (minimal) ────────────────────────────────────────────────────
const CONTRACT_ABI = [
  'function getContractStats() view returns (uint256 total, uint256 active, uint256 nextId)',
  'event TemperatureAlert(uint256 indexed shipmentId, int256 temperature, int256 threshold, string alertType, uint256 timestamp)',
  'event ShipmentReverted(uint256 indexed shipmentId, string reason, uint256 timestamp)',
]

// ── State ─────────────────────────────────────────────────────────────────────
let provider = null
let contract = null
let connected = false

// ── Connect with retry ────────────────────────────────────────────────────────
async function connect(attempt = 1) {
  try {
    provider = new ethers.JsonRpcProvider(RPC_URL)
    // Verify connection
    await provider.getBlockNumber()
    connected = true
    console.log(`[exporter] Connected to ${RPC_URL} (attempt ${attempt})`)

    if (CONTRACT_ADDR) {
      contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, provider)

      contract.on('TemperatureAlert', (shipmentId, _temp, _thresh, alertType) => {
        console.log(`[event] TemperatureAlert shipment=${shipmentId} type=${alertType}`)
        mTempAlerts.labels(alertType).inc()
      })

      contract.on('ShipmentReverted', (shipmentId, reason) => {
        console.log(`[event] ShipmentReverted shipment=${shipmentId} reason="${reason}"`)
        mReverted.labels(reason).inc()
      })

      // Reconnect on provider error
      provider.on('error', (err) => {
        console.error('[provider] Error:', err.message)
        connected = false
        setTimeout(() => connect(attempt + 1), 5000)
      })

      console.log(`[exporter] Listening to contract ${CONTRACT_ADDR}`)
    } else {
      console.warn('[exporter] CONTRACT_ADDRESS not set — contract metrics disabled')
    }
  } catch (err) {
    connected = false
    const delay = Math.min(30000, attempt * 3000)
    console.error(`[exporter] Connection failed (attempt ${attempt}): ${err.message}`)
    console.log(`[exporter] Retrying in ${delay / 1000}s…`)
    setTimeout(() => connect(attempt + 1), delay)
  }
}

// ── Scrape metrics ────────────────────────────────────────────────────────────
async function scrape() {
  if (!connected || !provider) return

  try {
    // Block height + block time
    const latest = await provider.getBlock('latest')
    if (latest) {
      mBlockHeight.set(latest.number)

      if (latest.number > 0) {
        const prev = await provider.getBlock(latest.number - 1)
        if (prev) mBlockTime.set(latest.timestamp - prev.timestamp)
      }
    }

    // Gas price
    const fee = await provider.getFeeData()
    if (fee.gasPrice) {
      mGasPrice.set(parseFloat(ethers.formatUnits(fee.gasPrice, 'gwei')))
    }

    // Contract stats
    if (contract) {
      const stats = await contract.getContractStats()
      mTotalShipments.set(Number(stats[0]))
      mActiveShipments.set(Number(stats[1]))
    }
  } catch (err) {
    mScrapeErrors.inc()
    console.error('[scrape] Error:', err.message)
    // If RPC is gone, trigger reconnect
    if (err.code === 'ECONNREFUSED' || err.code === 'ECONNRESET') {
      connected = false
      setTimeout(() => connect(), 5000)
    }
  }
}

// ── HTTP endpoints ────────────────────────────────────────────────────────────
app.get('/metrics', async (_req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (err) {
    res.status(500).end(String(err))
  }
})

app.get('/health', (_req, res) => {
  res.json({
    status: connected ? 'healthy' : 'degraded',
    connected,
    rpcUrl: RPC_URL,
    contractAddress: CONTRACT_ADDR || 'not configured',
    timestamp: new Date().toISOString(),
  })
})

app.get('/', (_req, res) => {
  res.json({
    name: 'VaccineChain Blockchain Exporter',
    version: '1.1.0',
    endpoints: { metrics: '/metrics', health: '/health' },
  })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[exporter] Listening on port ${PORT}`)
  console.log(`[exporter] Metrics: http://localhost:${PORT}/metrics`)
  console.log(`[exporter] Health:  http://localhost:${PORT}/health`)
  await connect()
  // Initial scrape then poll
  await scrape()
  setInterval(scrape, SCRAPE_INTERVAL)
})
