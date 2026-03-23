'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41]
})

interface LocationPickerProps {
  position: [number, number]
  onChange: (lat: number, lng: number) => void
}

function LocationMarker({ position, onChange }: LocationPickerProps) {
  const markerRef = useRef<L.Marker>(null)
  
  // Clicking on map moves marker
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })

  // Dragging marker moves it
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current
        if (marker != null) {
          const latLng = marker.getLatLng()
          onChange(latLng.lat, latLng.lng)
        }
      },
    }),
    [onChange],
  )

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
    />
  )
}

export default function LocationPickerMap({ position, onChange }: LocationPickerProps) {
  const [center, setCenter] = useState<[number, number]>(position)

  useEffect(() => {
    // Attempt to get user's current location if generic default is passed (e.g. Kathmandu center)
    // But for this, we just use the provided position.
    setCenter(position)
  }, [position])

  return (
    <div className="h-[300px] w-full rounded-2xl overflow-hidden border border-gray-200 z-0 relative">
      <MapContainer 
        key={`${center[0]}-${center[1]}`}
        center={center} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker position={position} onChange={onChange} />
      </MapContainer>
      
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm border border-gray-100 z-[400] pointer-events-none">
        Drag marker or tap map
      </div>
    </div>
  )
}
