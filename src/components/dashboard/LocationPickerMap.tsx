'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { Search, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

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

function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [center, map])
  return null
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
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await res.json()
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lon = parseFloat(data[0].lon)
        onChange(lat, lon)
      } else {
        toast.error('Location not found. Try a different search term.')
      }
    } catch (err) {
      console.error(err)
      toast.error('Search failed. Please check your connection.')
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="h-[300px] sm:h-[400px] w-full rounded-2xl overflow-hidden border border-gray-200 z-0 relative">
      {/* Search Overlay */}
      <div className="absolute top-4 left-4 right-4 sm:right-auto sm:w-80 z-[400]">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search location..."
            className="w-full bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-3 text-gray-400">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </div>
        </form>
      </div>

      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={true}
        touchZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        <ChangeView center={position} />
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

