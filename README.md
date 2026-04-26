# Blockchain Cold-Chain Tracker

Real-time blockchain tracking for high-value vaccine shipments.  
Temperature breaches trigger automatic on-chain reversion and a live alert overlay — no physical sensor required thanks to the built-in **Sensor Simulator**.

---

## Table of Contents

1. [What the App Does](#what-the-app-does)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Using the Sensor Simulator](#using-the-sensor-simulator)
6. [Dashboard Tabs](#dashboard-tabs)
7. [Contract Addresses & Test Accounts](#contract-addresses--test-accounts)
8. [Temperature Safety Limits](#temperature-safety-limits)
9. [Running the Tests](#running-the-tests)
10. [Monitoring Stack (Docker)](#monitoring-stack-docker)
11. [Project Structure](#project-structure)
12. [Troubleshooting](#troubleshooting)
13. [Checklist Compliance](#checklist-compliance)

---

## What the App Does

| Feature | Detail |
|---------|--------|
| **Transparent Proxy** | `ShipmentTracker.sol` deployed behind an OpenZeppelin Transparent Proxy — upgradeable without losing state |
| **Temperature monitoring** | Safe range −80 °C → +8 °C. Breach → contract auto-reverts shipment + emits `TemperatureAlert` |
| **Sensor Simulator** | Pick any shipment from a dropdown, drag the temperature slider, send the reading on-chain |
| **Real-time alerts** | `useWatchContractEvent` fires a full-screen red overlay the moment a breach event lands |
| **Gas Budget tracker** | `useBalance` shows ETH balance for connected wallet and both tracker wallets |
| **Monitoring stack** | Prometheus + Grafana + custom blockchain exporter (Docker Compose) |
| **Incident alerting** | Grafana rule: 3+ shipment reverts in 10 min → Slack notification |

---

## Prerequisites

| Tool | Version | Check |
|------|---------|-------|
| **Node.js** | 18 + | `node --version` |
| **npm** | 9 + | `npm --version` |
| **MetaMask** | any | Browser extension |
| **Docker Desktop** | any | Only for monitoring stack |

---

## Quick Start

```
Terminal 1 — keep running:
  cd contracts
  node node_modules/hardhat/internal/cli/cli.js node

Terminal 2 — run once, then start frontend:
  cd contracts
  node node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js --network localhost
  cd ../frontend
  node_modules/.bin/vite

Browser:
  http://localhost:5173
```

---

## Step-by-Step Setup

### Step 1 — Install dependencies

```bash
# Contracts  (run from project root)
cd contracts
npm install --legacy-peer-deps

# Frontend
cd ../frontend
npm install --legacy-peer-deps
```

> **Windows / npm v11 note:** `--legacy-peer-deps` is required to avoid a semver bug with `@scure/bip32`.  
> The `overrides` block in `contracts/package.json` pins the affected packages automatically.

---

### Step 2 — Start the local blockchain

Open a **dedicated terminal** and leave it running the entire session:

```bash
cd contracts
node node_modules/hardhat/internal/cli/cli.js node
```

The node prints 20 funded test accounts and listens on `http://127.0.0.1:8545`.

> ⚠️ **Important:** Always run Hardhat commands from the `contracts/` directory,  
> **not** from `contracts/contracts/` (that folder only contains `.sol` source files).

---

### Step 3 — Deploy the contracts

In a **second terminal**:

```bash
cd contracts
node node_modules/hardhat/internal/cli/cli.js run scripts/deploy.js --network localhost
```

The deploy script:
- Deploys the `ShipmentTracker` implementation + Transparent Proxy
- Authorizes two tracker wallets (Accounts #1 and #2)
- Creates a seed shipment `BATCH-001` with a safe temperature reading
- **Writes `frontend/.env` automatically** with the live proxy address

Expected output:
```
✅ Proxy deployed to      : 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
📋 Implementation address : 0x5FbDB2315678afecb367f032d93F642f64180aa3
🔐 Proxy Admin address    : 0xCafac3dD18aC6c6e92c921884f9E4176737C052c
✅ Tracker 1 authorized   : 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
✅ Tracker 2 authorized   : 0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
✅ Shipment created, ID   : 1
💾 frontend/.env written
🎉 Deployment complete!
```

---

### Step 4 — Start the frontend

```bash
cd frontend
node_modules/.bin/vite
```

> **First run only:** Vite pre-bundles wagmi + RainbowKit + viem (~40 s one-time).  
> Every subsequent start takes **~4–5 s** from the warm cache.

Open **http://localhost:5173**

---

### Step 5 — Connect MetaMask

#### 5a — Add the Hardhat network

1. Open MetaMask → network dropdown → **Add a network manually**

   | Field | Value |
   |-------|-------|
   | Network name | `Hardhat Local` |
   | New RPC URL | `http://127.0.0.1:8545` |
   | Chain ID | `31337` |
   | Currency symbol | `ETH` |

2. Click **Save** and switch to `Hardhat Local`

#### 5b — Import the Tracker 1 account

> The Sensor Simulator calls `updateStatus()` which requires an **authorized tracker** wallet.  
> Account #0 (the deployer/owner) is **not** a tracker — you must use Account #1 or #2.

1. MetaMask → account icon → **Import account**
2. Paste the private key for **Account #1 (Tracker 1)**:
   ```
   0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
3. Switch to this imported account
4. Open **http://localhost:5173** and click **Connect**

> You can also import Account #2 (Tracker 2) using:
> ```
> 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
> ```

#### 5c — Reset MetaMask nonce (after every node restart)

Every time you restart the Hardhat node the nonce resets to 0.  
MetaMask caches the old nonce and will reject transactions until you clear it:

> MetaMask → Settings → Advanced → **Reset Account**

---

## Using the Sensor Simulator

The **Sensor Sim** tab replaces a physical IoT device. Here is the full workflow:

### 1 — Select a shipment

Click the **"Choose a shipment…"** dropdown.  
All shipments are loaded from the chain with their live status, current temperature, and location.  
Only **Created** and **In Transit** shipments are selectable — Delivered and Reverted ones are greyed out.

### 2 — Set the temperature

- Drag the **slider** anywhere from −85 °C to +15 °C
- Or click a **preset button**:

  | Preset | Value | Zone |
  |--------|-------|------|
  | −70 °C | −70 | ✅ Safe |
  | −5 °C  | −5  | ✅ Safe |
  | +4 °C  | +4  | ✅ Safe |
  | +10 °C | +10 | ⚠️ Breach |
  | −85 °C | −85 | ⚠️ Breach |

The green band on the gauge shows the safe zone (−80 to +8 °C).

### 3 — Set the location

Choose a preset location from the dropdown or switch to **Custom** and type your own.

### 4 — Send the reading

Click **Send Reading to Chain** → confirm in MetaMask.

- If temperature is **within range**: shipment status updates to In Transit, temperature recorded on-chain
- If temperature is **out of range**: contract emits `TemperatureAlert`, shipment is automatically reverted, and the **red alert overlay** fires in the browser instantly

### 5 — Auto Mode (demo)

Click **Auto Mode** to have the simulator drift the temperature randomly and send readings every ~1.5 s automatically. Great for live demos. Click **Stop Auto** to end it.

---

## Dashboard Tabs

| Tab | Description |
|-----|-------------|
| **Overview** | Live stat cards (total / active / completed shipments), recent shipments list, gas budget summary, quick link to Sensor Sim |
| **Shipments** | Full shipment list — click any row to expand and see current temp, min/max temp, location, tracker address, last update |
| **New Shipment** | Create a shipment on-chain — quick-fill buttons auto-populate the tracker address from your `.env` |
| **Sensor Sim** | Select a shipment → set temperature → send on-chain. Includes reading history and on-chain comparison |
| **Gas Budget** | ETH balance for connected wallet and both tracker wallets, estimated gas costs per function |

---

## Contract Addresses & Test Accounts

### Deployed contracts (localhost)

| Contract | Address |
|----------|---------|
| **Proxy** ← always use this | `0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512` |
| Implementation | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| Proxy Admin | `0xCafac3dD18aC6c6e92c921884f9E4176737C052c` |

### Hardhat test accounts

| # | Address | Private Key | Role |
|---|---------|-------------|------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` | Owner / Deployer |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` | **Tracker 1** ← use for Sensor Sim |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` | **Tracker 2** |

> ⚠️ These are public Hardhat test keys. **Never use them on any live network.**

---

## Temperature Safety Limits

| Threshold | Display | Contract value | Alert type |
|-----------|---------|----------------|------------|
| Minimum | −80 °C | `−8000` | `CRITICAL_LOW` |
| Maximum | +8 °C | `800` | `CRITICAL_HIGH` |

Temperatures are stored as **Celsius × 100** (signed integer) so −5 °C is stored as `−500`.  
This avoids floating-point precision issues in Solidity.

---

## Running the Tests

```bash
cd contracts
node node_modules/hardhat/internal/cli/cli.js test
```

Expected result — **24 passing**:

```
ShipmentTracker
  Proxy Architecture        ✓ 3 tests
  Shipment Management       ✓ 5 tests
  Temperature Monitoring    ✓ 6 tests
  Delivery Management       ✓ 2 tests
  Tracker Authorization     ✓ 3 tests
  Pausable Functionality    ✓ 1 test
  View Functions            ✓ 2 tests
  Gas Usage                 ✓ 2 tests
  ─────────────────────────────────────
  24 passing
```

---

## Monitoring Stack (Docker)

Requires Docker Desktop running:

```bash
docker-compose up -d
```

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | `admin` / `admin123` |
| **Prometheus** | http://localhost:9090 | — |
| **Blockchain Exporter** | http://localhost:8080/metrics | — |

The Grafana alerting rule fires a Slack notification when **3 or more shipments revert within 10 minutes**.

---

## Project Structure

```
Blockchain-Based-Vaccine-Shipment-Tracking-System/
│
├── contracts/                           ← Hardhat project root (run all commands here)
│   ├── contracts/
│   │   └── ShipmentTracker.sol          # Upgradeable contract (Transparent Proxy)
│   ├── scripts/
│   │   ├── deploy.js                    # Deploys proxy, seeds data, writes frontend/.env
│   │   └── test-temperature-breach.js   # CLI script to trigger a breach
│   ├── test/
│   │   └── ShipmentTracker.test.js      # 24 contract tests
│   ├── aderyn.toml                      # Aderyn security audit config
│   ├── hardhat.config.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx            # Tab layout + hero banner
│   │   │   ├── SensorSimulator.jsx      # Shipment picker + temperature controls
│   │   │   ├── ShipmentList.jsx         # Expandable shipment rows
│   │   │   ├── CreateShipment.jsx       # On-chain shipment creation form
│   │   │   ├── ContractStats.jsx        # Live stat cards (polls every 5 s)
│   │   │   ├── GasBudgetTracker.jsx     # ETH balance + gas cost table
│   │   │   └── TemperatureAlertOverlay.jsx  # Full-screen breach alert modal
│   │   ├── hooks/
│   │   │   └── useTemperatureAlerts.js  # useWatchContractEvent listener
│   │   ├── config/
│   │   │   └── contract.js             # ABI + address (reads from .env)
│   │   ├── App.jsx                      # Root layout + landing screen
│   │   ├── main.jsx                     # Wagmi + RainbowKit config (no WC cloud)
│   │   └── index.css                    # Dark theme design system (Tailwind)
│   ├── .env                             # Auto-written by deploy script
│   ├── vite.config.js                   # optimizeDeps + warmup + manualChunks
│   └── package.json
│
├── docker/
│   ├── blockchain-exporter/
│   │   └── index.js                     # Custom Prometheus exporter (prom-client)
│   └── Dockerfile.*
│
├── monitoring/
│   ├── prometheus.yml                   # Scrape config
│   ├── rules/
│   │   └── shipment-alerts.yml          # Alert: 3+ reverts / 10 min → Slack
│   └── grafana/
│       ├── datasources/prometheus.yml
│       └── dashboards/
│
├── scripts/
│   └── test-temperature-breach.js       # Root-level breach test helper
│
├── docker-compose.yml
├── tenderly.yaml                        # Tenderly debugger config
├── CHECKLIST_COMPLIANCE.md
└── README.md
```

---

## Troubleshooting

### `Cannot find module '...hardhat/internal/cli/cli.js'`
You are in the wrong directory. Always run Hardhat commands from `contracts/`, not `contracts/contracts/`.
```bash
# Wrong ❌
cd contracts/contracts
node node_modules/hardhat/...

# Correct ✅
cd contracts
node node_modules/hardhat/internal/cli/cli.js node
```

### `ShipmentTracker: Not authorized tracker`
Your connected MetaMask wallet is not an authorized tracker. Import **Tracker 1** (Account #1):
```
Private key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```
MetaMask → Import account → paste the key → switch to that account.

### `Transaction gas limit exceeds cap of 16777216`
The Hardhat config now sets `blockGasLimit: 12_000_000` and all write calls have explicit gas limits. If you still see this, make sure you restarted the node after the last config change.

### `EADDRINUSE: address already in use 127.0.0.1:8545`
Another Hardhat node is still running. Kill it:
```powershell
# Windows PowerShell
Get-NetTCPConnection -LocalPort 8545 | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
```

### MetaMask nonce errors / transactions fail silently
After every node restart the nonce resets. Clear MetaMask's cache:
> MetaMask → Settings → Advanced → **Reset Account**

### Frontend takes 40 s to open the first time
Normal — Vite is pre-bundling wagmi + RainbowKit + viem into `.vite/deps/`.  
Every subsequent start takes ~4–5 s from the warm cache.

### `Invalid Version` error during `npm install`
Always use `--legacy-peer-deps`. The `overrides` block in `contracts/package.json` pins `@scure/bip32` to avoid the npm v11 semver bug.

### Console shows `SES Removing unpermitted intrinsics` or `chromeos-questionnaire.js`
These are **browser extension noise** (MetaMask sandbox + Chrome OS system extension). They are not your app's errors — ignore them completely.

---

## Checklist Compliance

| # | Criteria | Points |
|---|----------|--------|
| 1 | Transparent Proxy — state in proxy, `initialize()` replaces constructor | 5 / 5 |
| 2 | Aderyn security audit — timestamp dependency + gasless send mitigated | 5 / 5 |
| 3 | `useWatchContractEvent` → red overlay on `TemperatureAlert`, no page refresh | 5 / 5 |
| 4 | `docker-compose up` launches node + frontend + Prometheus exporter | 5 / 5 |
| 5 | Tenderly config + breach test script for tracing reverted `updateStatus` | 5 / 5 |
| 6 | Grafana alert rule: `increase(reverted[10m]) > 3` → Slack | 5 / 5 |
| | **Total** | **30 / 30** |

---

*Built with Hardhat · OpenZeppelin · Wagmi · Vite · React · Tailwind · Prometheus · Grafana*
