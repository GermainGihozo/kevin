import { useState, useEffect, useRef } from 'react'
import { useWatchContractEvent } from 'wagmi'
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contract'

export function useTemperatureAlerts() {
  const [alerts, setAlerts] = useState([])
  // Track which alert IDs already have a dismiss timer so we don't double-schedule
  const timerMap = useRef({})

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'TemperatureAlert',
    onLogs(logs) {
      const newAlerts = logs.map(log => ({
        id: `${log.transactionHash}-${log.logIndex}`,
        shipmentId: Number(log.args.shipmentId),
        temperature: Number(log.args.temperature),
        threshold: Number(log.args.threshold),
        alertType: log.args.alertType,
        timestamp: Number(log.args.timestamp),
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
      }))
      setAlerts(prev => [...newAlerts, ...prev])
    },
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    eventName: 'ShipmentReverted',
    onLogs(logs) {
      logs.forEach(log => {
        console.log(`[ShipmentReverted] id=${log.args.shipmentId} reason="${log.args.reason}"`)
      })
    },
  })

  // Bug fix: schedule a per-alert timer only once when the alert is first added
  useEffect(() => {
    alerts.forEach(alert => {
      if (timerMap.current[alert.id]) return   // already scheduled
      timerMap.current[alert.id] = setTimeout(() => {
        setAlerts(prev => prev.filter(a => a.id !== alert.id))
        delete timerMap.current[alert.id]
      }, 30_000)
    })
  }, [alerts])

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      Object.values(timerMap.current).forEach(clearTimeout)
    }
  }, [])

  const dismissAlert = (alertId) => {
    clearTimeout(timerMap.current[alertId])
    delete timerMap.current[alertId]
    setAlerts(prev => prev.filter(a => a.id !== alertId))
  }

  const dismissAllAlerts = () => {
    Object.values(timerMap.current).forEach(clearTimeout)
    timerMap.current = {}
    setAlerts([])
  }

  return { alerts, dismissAlert, dismissAllAlerts, hasAlerts: alerts.length > 0 }
}
