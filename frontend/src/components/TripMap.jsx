import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getSlotMeta } from '../lib/itinerary'

const ACCENT = '#4f46e5'
const MUTED  = '#a5b4fc'

// Cached so hovering a day swaps icons instead of rebuilding every marker
const icons = new Map()

function pinIcon(size, color, label = '', opacity = 1) {
  const key = [size, color, label, opacity].join('|')
  if (!icons.has(key)) {
    icons.set(key, L.divIcon({
      className: '',
      html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};opacity:${opacity};color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;line-height:1;border:1.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${label}</div>`,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -(size / 2 + 2)],
    }))
  }
  return icons.get(key)
}

function FitBounds({ stops, recenter }) {
  const map = useMap()
  const hasFitted = useRef(false)

  useEffect(() => {
    if (stops.length === 0) return
    const animate = hasFitted.current
    hasFitted.current = true

    if (stops.length === 1) {
      const center = [stops[0].lat, stops[0].lng]
      if (animate) map.flyTo(center, 14, { duration: 0.6 })
      else map.setView(center, 14)
      return
    }

    const bounds  = L.latLngBounds(stops.map(s => [s.lat, s.lng]))
    const options = { padding: [36, 36], maxZoom: 15 }
    if (animate) map.flyToBounds(bounds, { ...options, duration: 0.6 })
    else map.fitBounds(bounds, options)
  }, [stops, recenter, map])

  return null
}

// The card changes height between breakpoints, which Leaflet doesn't notice on its own
function WatchSize() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

function StopPopup({ stop, detail }) {
  return (
    <Popup>
      <div style={{ minWidth: 140 }}>
        <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{stop.place}</p>
        {detail && <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>{detail}</p>}
        {stop.activity && <p style={{ color: '#374151', fontSize: 11, margin: '4px 0 0' }}>{stop.activity}</p>}
      </div>
    </Popup>
  )
}

/**
 * numbered: one day's stops, pinned in timeline order and coloured by time of day.
 * Otherwise the whole trip as dots, with highlightDay drawn as a numbered route on top.
 */
export default function TripMap({ stops, numbered, highlightDay = 0, recenter = 0 }) {
  if (stops.length === 0) return null

  const highlighted = numbered ? [] : stops.filter(s => s.day === highlightDay)
  const route = numbered ? stops : highlighted

  return (
    <MapContainer
      center={[stops[0].lat, stops[0].lng]}
      zoom={13}
      scrollWheelZoom={false}
      className="h-75 w-full lg:h-105"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds stops={stops} recenter={recenter} />
      <WatchSize />

      {route.length > 1 && (
        <Polyline
          key={numbered ? 'day' : 'trip'}
          positions={route.map(s => [s.lat, s.lng])}
          pathOptions={numbered
            ? { color: ACCENT, weight: 2, opacity: 0.45, dashArray: '5 5' }
            : { color: ACCENT, weight: 2.5, opacity: 0.6 }}
        />
      )}

      {numbered
        ? stops.map(stop => (
            <Marker
              key={`${stop.num}-${stop.place}`}
              position={[stop.lat, stop.lng]}
              icon={pinIcon(24, getSlotMeta(stop.slot).hex, stop.num)}
            >
              <StopPopup stop={stop} detail={[stop.startTime, stop.duration].filter(Boolean).join(' · ')} />
            </Marker>
          ))
        : stops.map((stop, i) => {
            const on = stop.day === highlightDay
            return (
              <Marker
                key={i}
                position={[stop.lat, stop.lng]}
                zIndexOffset={on ? 500 : 0}
                icon={on
                  ? pinIcon(22, ACCENT, highlighted.indexOf(stop) + 1)
                  : pinIcon(10, MUTED, '', highlightDay ? 0.35 : 0.9)}
              >
                <StopPopup stop={stop} detail={`Day ${stop.day}${stop.startTime ? ` · ${stop.startTime}` : ''}`} />
              </Marker>
            )
          })}
    </MapContainer>
  )
}
