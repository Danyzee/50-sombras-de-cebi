/**
 * sync.js — Real-time channel abstraction
 *
 * Supports two modes:
 *  1. LOCAL — BroadcastChannel (same browser, different tabs). Zero setup.
 *  2. SUPABASE — Supabase Realtime (different devices over the internet).
 *
 * The API is identical in both modes, so levels don't need to care.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(SUPABASE_URL && SUPABASE_KEY)

// ----------------------------------------------------------------
// LOCAL CHANNEL (BroadcastChannel — same browser only)
// ----------------------------------------------------------------
class LocalChannel {
  constructor(roomCode) {
    this.roomCode = roomCode
    this.bc = new BroadcastChannel(`mystic-tower:${roomCode}`)
    this._handlers = {}
    this._presenceMap = new Map()
    this._presenceCb = null
    this._subscribed = false

    this.bc.onmessage = ({ data }) => {
      const { event, payload } = data
      if (event === '__presence__') {
        this._presenceMap.set(payload.key, payload)
        if (this._presenceCb) this._presenceCb()
        return
      }
      const handlers = this._handlers[event] || []
      handlers.forEach(fn => fn({ payload }))
    }
  }

  on(type, filter, callback) {
    if (type === 'broadcast') {
      const key = filter.event
      if (!this._handlers[key]) this._handlers[key] = []
      this._handlers[key].push(callback)
    }
    if (type === 'presence') {
      this._presenceCb = callback
    }
    return this
  }

  off(type, filter, callback) {
    if (type === 'broadcast') {
      const key = filter.event
      if (this._handlers[key]) {
        this._handlers[key] = this._handlers[key].filter(fn => fn !== callback)
      }
    }
    if (type === 'presence') {
      if (this._presenceCb === callback) this._presenceCb = null
    }
    return this
  }

  async send({ type, event, payload }) {
    if (type === 'broadcast') {
      this.bc.postMessage({ event, payload })
    }
    return 'ok'
  }

  async track(data) {
    const key = `${data.role}-${Math.random().toString(36).slice(2, 6)}`
    const entry = { ...data, key }
    this._presenceMap.set(key, entry)
    this.bc.postMessage({ event: '__presence__', payload: entry })
    if (this._presenceCb) this._presenceCb()
    return 'ok'
  }

  presenceState() {
    return Object.fromEntries(this._presenceMap)
  }

  async subscribe(callback) {
    if (!this._subscribed) {
      this._subscribed = true
      setTimeout(() => callback('SUBSCRIBED'), 50)
    }
    return this
  }

  async unsubscribe() {
    this.bc.close()
  }
}

// ----------------------------------------------------------------
// SUPABASE CHANNEL
// ----------------------------------------------------------------
let _supabaseClient = null

async function getSupabase() {
  if (_supabaseClient) return _supabaseClient
  const { createClient } = await import('@supabase/supabase-js')
  _supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY)
  return _supabaseClient
}

class SupabaseChannel {
  constructor(roomCode, rawChannel) {
    this.roomCode = roomCode
    this._channel = rawChannel
    this._handlers = {}
    this._presenceCb = null

    // Register presence sync listener immediately (before subscription)
    this._channel.on('presence', { event: 'sync' }, () => {
      if (this._presenceCb) {
        try {
          this._presenceCb()
        } catch (e) {
          console.error('Error in presence sync handler:', e)
        }
      }
    })
  }

  on(type, filter, callback) {
    if (type === 'broadcast') {
      const eventName = filter.event
      if (!this._handlers[eventName]) {
        this._handlers[eventName] = []
        // Register native listener dynamically the first time this event is needed
        this._channel.on('broadcast', { event: eventName }, ({ payload }) => {
          const handlers = this._handlers[eventName] || []
          handlers.forEach(fn => {
            try {
              fn({ payload })
            } catch (e) {
              console.error(`Error in broadcast handler for ${eventName}:`, e)
            }
          })
        })
      }
      this._handlers[eventName].push(callback)
    }
    if (type === 'presence') {
      this._presenceCb = callback
    }
    return this
  }

  off(type, filter, callback) {
    if (type === 'broadcast') {
      const eventName = filter.event
      if (this._handlers[eventName]) {
        this._handlers[eventName] = this._handlers[eventName].filter(fn => fn !== callback)
      }
    }
    if (type === 'presence') {
      if (this._presenceCb === callback) this._presenceCb = null
    }
    return this
  }

  async send({ type, event, payload }) {
    return this._channel.send({ type, event, payload })
  }

  async track(data) {
    return this._channel.track(data)
  }

  presenceState() {
    return this._channel.presenceState()
  }

  async subscribe(callback) {
    this._channel.subscribe(callback)
    return this
  }

  async unsubscribe() {
    if (_supabaseClient) {
      try {
        await _supabaseClient.removeChannel(this._channel)
      } catch (err) {
        console.error('Error removing channel:', err)
      }
    } else {
      await this._channel.unsubscribe()
    }
  }
}

// ----------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------

/**
 * createChannel(roomCode) → channel object
 * Returns a LocalChannel or SupabaseChannel depending on config.
 */
export async function createChannel(roomCode) {
  if (isSupabaseConfigured) {
    const supabase = await getSupabase()
    const raw = supabase.channel(`room:${roomCode}`, {
      config: { presence: { key: roomCode } },
    })
    return new SupabaseChannel(roomCode, raw)
  }
  return new LocalChannel(roomCode)
}

/**
 * Helper: broadcast a game event through a channel.
 */
export function broadcast(channel, event, payload) {
  return channel.send({ type: 'broadcast', event, payload })
}
