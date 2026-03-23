'use client'

import React from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'

// Fix generic Leaflet icon issue in Next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

interface SimpleMapProps {
  center: [number, number]
  zoom?: number
  markerPosition?: [number, number]
  style?: React.CSSProperties
}

/**
 * A stable Leaflet Map wrapper to avoid fragmented dynamic imports
 * and "Map container is being reused" errors in Next.js.
 */
export default function SimpleMap({ 
  center, 
  zoom = 15, 
  markerPosition, 
  style = { height: '100%', width: '100%' } 
}: SimpleMapProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={style}
      scrollWheelZoom={false}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markerPosition && (
        <Marker position={markerPosition} icon={customIcon} />
      )}
    </MapContainer>
  )
}
