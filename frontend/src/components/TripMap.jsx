import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { getSlotMeta, dayWaypoints, slotsInPlan } from '../lib/itinerary'

function makeIcon(number, slot) {
  const bg = getSlotMeta(slot).hex
  return L.divIcon({
    className: '',
    html: `<div style="background:${bg};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);">${number}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  })
}

function FitBounds({ waypoints }) {
  const map = useMap()
  useEffect(() => {
    if (waypoints.length === 0) return
    if (waypoints.length === 1) {
      map.setView([waypoints[0].lat, waypoints[0].lng], 14)
    } else {
      map.fitBounds(
        L.latLngBounds(waypoints.map(w => [w.lat, w.lng])),
        { padding: [40, 40] },
      )
    }
  }, [waypoints, map])
  return null
}

export default function TripMap({ days }) {
  const [selectedDay, setSelectedDay] = useState(0)

  const allWaypoints = useMemo(
    () => (days || []).flatMap(dayWaypoints),
    [days],
  )

  const legend = useMemo(() => slotsInPlan(days), [days])

  const filteredWaypoints = useMemo(
    () => selectedDay === 0 ? allWaypoints : allWaypoints.filter(w => w.day === selectedDay),
    [allWaypoints, selectedDay],
  )

  const numbered = useMemo(
    () => filteredWaypoints.map((w, i) => ({ ...w, num: i + 1 })),
    [filteredWaypoints],
  )

  if (allWaypoints.length === 0) return null

  const multiDay = days?.length > 1

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 pt-4 pb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <span>🗺️</span> Map View
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-gray-500">
          {legend.map(slot => {
            const meta = getSlotMeta(slot)
            return (
              <span key={slot} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: meta.hex }}
                />
                {meta.label}
              </span>
            )
          })}
        </div>
      </div>

      {multiDay && (
        <div className="px-5 pb-3 flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedDay(0)}
            className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
              selectedDay === 0
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'
            }`}
          >
            All Days
          </button>
          {days.map(d => {
            if (dayWaypoints(d).length === 0) return null
            return (
              <button
                key={d.day}
                onClick={() => setSelectedDay(d.day)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  selectedDay === d.day
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-600 hover:border-gray-400'
                }`}
              >
                Day {d.day}
              </button>
            )
          })}
        </div>
      )}

      <MapContainer
        center={[allWaypoints[0].lat, allWaypoints[0].lng]}
        zoom={13}
        style={{ height: '360px', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds waypoints={numbered} />
        {numbered.map((w, i) => (
          <Marker key={i} position={[w.lat, w.lng]} icon={makeIcon(w.num, w.slot)}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <p style={{ fontWeight: 600, fontSize: 13, margin: 0 }}>{w.place}</p>
                <p style={{ color: '#6b7280', fontSize: 11, margin: '2px 0 0' }}>
                  Day {w.day} · {getSlotMeta(w.slot).label}{w.startTime ? ` · ${w.startTime}` : ''}
                </p>
                <p style={{ color: '#374151', fontSize: 11, margin: '4px 0 0' }}>{w.activity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {numbered.length > 1 && (
          <Polyline
            positions={numbered.map(w => [w.lat, w.lng])}
            color="#6366f1"
            weight={2}
            opacity={0.55}
            dashArray="6 5"
          />
        )}
      </MapContainer>
    </div>
  )
}
