"use client"

import { useEffect, useRef } from "react"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
const TENANT_SLUG = "default"

interface RealtimeHandlers {
  onProductsChanged?: () => void
  onCategoriesChanged?: () => void
  onSettingsChanged?: () => void
  onOffersChanged?: () => void
  onOrdersChanged?: () => void
  onDeliveryNotesChanged?: () => void
}

/**
 * Connects to the backend Socket.IO gateway (`/realtime` namespace) over a
 * raw WebSocket using the Engine.IO v4 / Socket.IO v5 wire protocol:
 *   0{...}                  -> server open packet
 *   40/realtime,{...}       -> join namespace (we send this)
 *   2 / 3                   -> ping / pong
 *   42/realtime,["ev",data] -> event frame
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
      return `${wsUrl}/socket.io/?EIO=4&transport=websocket&tenant=${TENANT_SLUG}`
    }

    const handleEvent = (eventName: string) => {
      const handlers = handlersRef.current
      if (eventName.startsWith("product:")) {
        handlers.onProductsChanged?.()
      } else if (eventName.startsWith("category:")) {
        handlers.onCategoriesChanged?.()
      } else if (eventName === "settings:updated") {
        handlers.onSettingsChanged?.()
      } else if (eventName.startsWith("offer:")) {
        handlers.onOffersChanged?.()
      } else if (eventName.startsWith("order:")) {
        handlers.onOrdersChanged?.()
      } else if (eventName.startsWith("delivery-note:")) {
        handlers.onDeliveryNotesChanged?.()
      }
    }

    const connect = () => {
      if (disposed) return
      try {
        ws = new WebSocket(buildUrl())

        ws.onopen = () => {
          console.log("[Realtime] socket open")
        }

        ws.onmessage = (event) => {
          try {
            const raw = event.data as string

            // Engine.IO ping -> reply pong
            if (raw === "2") {
              ws?.send("3")
              return
            }

            // Server open packet `0{...}` -> join the /realtime namespace
            if (raw.startsWith("0{")) {
              ws?.send(`40/realtime,${JSON.stringify({ tenant: TENANT_SLUG })}`)
              console.log("[Realtime] joining /realtime namespace")
              return
            }

            // Namespace ack `40/realtime,{...}` or `40{...}` -> connected
            if (raw.startsWith("40")) {
              console.log("[Realtime] connected to namespace")
              return
            }

            // Event frame `42/realtime,["event:name", {...}]`
            if (raw.startsWith("42")) {
              const idx = raw.indexOf(",")
              const json = idx === -1 ? raw.substring(2) : raw.substring(idx + 1)
              const decoded = JSON.parse(json)
              if (Array.isArray(decoded) && typeof decoded[0] === "string") {
                handleEvent(decoded[0])
              }
              return
            }
          } catch (e) {
            // ignore malformed frames
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
