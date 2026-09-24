import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const pin = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9999px;background:#4f46e5;border:2.5px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.35)"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
  tooltipAnchor: [0, -10],
})

// The card changes width between breakpoints, which Leaflet doesn't notice on its own
function WatchSize() {
  const map = useMap()
  useEffect(() => {
    const observer = new ResizeObserver(() => map.invalidateSize())
    observer.observe(map.getContainer())
    return () => observer.disconnect()
  }, [map])
  return null
}

export default function PlaceMap({ lat, lng, label, zoom = 10, className = 'h-56 w-full' }) {
  return (
    <MapContainer center={[lat, lng]} zoom={zoom} scrollWheelZoom={false} className={className}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <WatchSize />
      <Marker position={[lat, lng]} icon={pin}>
        {label && <Tooltip direction="top">{label}</Tooltip>}
      </Marker>
    </MapContainer>
  )
}
