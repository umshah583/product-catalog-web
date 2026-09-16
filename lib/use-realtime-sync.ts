"use client"

import { useEffect, useRef } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const TENANT_SLUG = "default"

interface RealtimeHandlers {
  onProductsChanged?: () => void
  onCategoriesChanged?: () => void
  onSettingsChanged?: () => void
  onOffersChanged?: () => void
}

/**
 * Connects to the backend realtime WebSocket and invokes the provided
 * handlers whenever the admin portal mutates data. Lets multiple admin
 * sessions stay in sync without manual refresh.
 */
export function useRealtimeSync(handlers: RealtimeHandlers) {
  const handlersRef = useRef(handlers)
  handlersRef.current = handlers

  useEffect(() => {
    let ws: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const buildUrl = () => {
      let wsUrl = API_BASE_URL
      if (wsUrl.startsWith("https://")) {
        wsUrl = `wss://${wsUrl.substring(8)}`
      } else if (wsUrl.startsWith("http://")) {
        wsUrl = `ws://${wsUrl.substring(7)}`
      }
      if (wsUrl.endsWith("/")) wsUrl = wsUrl.substring(0, wsUrl.length - 1)
      return `${wsUrl}/realtime?tenant=${TENANT_SLUG}`
    }

    const connect = () => {
      if (disposed) return
      try {
        ws = new WebSocket(buildUrl())

        ws.onopen = () => {
          console.log("[Realtime] connected")
        }

        ws.onmessage = (event) => {
          try {
            const decoded = JSON.parse(event.data)
            const eventName = decoded?.event as string | undefined
            const handlers = handlersRef.current
            if (!eventName) return

            if (eventName.startsWith("product:")) {
              handlers.onProductsChanged?.()
            } else if (eventName.startsWith("category:")) {
              handlers.onCategoriesChanged?.()
            } else if (eventName === "settings:updated") {
              handlers.onSettingsChanged?.()
            } else if (eventName.startsWith("offer:")) {
              handlers.onOffersChanged?.()
            }
          } catch (e) {
            // ignore non-JSON frames
          }
        }

        ws.onerror = () => {
          console.warn("[Realtime] socket error")
        }

        ws.onclose = () => {
          if (disposed) return
          console.log("[Realtime] disconnected, reconnecting in 5s")
          reconnectTimer = setTimeout(connect, 5000)
        }
      } catch (e) {
        console.warn("[Realtime] connection failed", e)
        reconnectTimer = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      if (ws) ws.close()
    }
  }, [])
}
