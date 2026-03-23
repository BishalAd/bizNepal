'use client'

import React, { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import Link from 'next/link'
import { Star, MapPin } from 'lucide-react'

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

function MapTracker({ setBounds }: any) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
    },
    zoomend: () => {
      setBounds(map.getBounds())
    }
  })

  useEffect(() => {
    setBounds(map.getBounds())
  }, [map, setBounds])

  return null
}

export default function BusinessMap({ businesses, onBoundsChange }: any) {
  // Center of Nepal roughly
  const defaultCenter: [number, number] = [28.3949, 84.1240]

  return (
    <div className="w-full h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] z-0 absolute top-0 left-0 right-0">
      <MapContainer 
        center={defaultCenter} 
        zoom={7} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {onBoundsChange && <MapTracker setBounds={onBoundsChange} />}

        <MarkerClusterGroup chunkedLoading>
          {businesses.filter((b: any) => b.latitude && b.longitude).map((business: any) => (
            <Marker 
              key={business.id} 
              position={[business.latitude, business.longitude]}
              icon={customIcon}
            >
              <Popup className="custom-popup rounded-2xl overflow-hidden border-0">
                <div className="w-56 pb-2 -mx-5 -mt-4 bg-white rounded-t-xl overflow-hidden">
                   {business.cover_url ? (
                     <img src={business.cover_url} className="w-full h-24 object-cover" />
                   ) : (
                     <div className="w-full h-24 bg-blue-900/10"></div>
                   )}
                   
                   <div className="px-4 mt-3">
                     <h3 className="font-bold text-gray-900 text-base leading-tight mb-1 truncate">{business.name}</h3>
                     <div className="flex items-center gap-1.5 mb-2">
                       <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-500" />
                       <span className="text-sm font-bold text-gray-700">{business.rating || '0.0'}</span>
                       <span className="text-xs text-gray-500">({business.review_count || 0})</span>
                     </div>
                     <p className="text-xs text-gray-600 flex items-center gap-1 mb-3 truncate"><MapPin className="w-3 h-3 text-red-500"/> {business.city || 'Nepal'}</p>
                     
                     <Link 
                        href={`/businesses/${business.slug}`} 
                        className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2.5 rounded-xl font-bold text-sm transition shadow-sm"
                        onClick={(e) => {
                          window.location.href = `/businesses/${business.slug}`;
                        }}
                      >
                       View Business Profile
                     </Link>
                   </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
      
      {/* Add custom zoom controls if needed elsewhere, or stick to Leaflet defaults by leaving zoomControl=true */}
    </div>
  )
}
