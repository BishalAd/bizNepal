'use client'

import React, { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import Link from 'next/link'
import { Star, MapPin, Search, Navigation, Loader2 } from 'lucide-react'

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

function MapTracker({ setBounds, mapRef }: any) {
  const map = useMapEvents({
    moveend: () => {
      setBounds(map.getBounds())
    },
    zoomend: () => {
      setBounds(map.getBounds())
    }
  })

  useEffect(() => {
    if (mapRef) {
      mapRef.current = map
    }
    setBounds(map.getBounds())
  }, [map, setBounds, mapRef])

  return null
}

export default function BusinessMap({ businesses, districts, onBoundsChange }: any) {
  const mapRef = React.useRef<any>(null)
  const defaultCenter: [number, number] = [28.3949, 84.1240]

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value
    if (!districtId) return

    // Find the first business in this district to zoom to, or use a capital fallback
    const districtBusinesses = businesses.filter((b: any) => b.district_id === districtId && b.latitude && b.longitude)
    
    if (districtBusinesses.length > 0) {
      mapRef.current?.flyTo([districtBusinesses[0].latitude, districtBusinesses[0].longitude], 12, {
        duration: 1.5,
        easeLinearity: 0.25
      })
    } else {
      const majorCenters: Record<string, [number, number]> = {
        'Kathmandu': [27.7172, 85.3240], 'Kaski': [28.2096, 83.9856], 'Lalitpur': [27.6744, 85.3240],
        'Chitwan': [27.5333, 84.4500], 'Rupandehi': [27.7000, 83.4500], 'Jhapa': [26.6333, 87.9833],
        'Morang': [26.4525, 87.2717], 'Sunsari': [26.5833, 87.1500], 'Parsa': [27.0167, 84.8833],
        'Makwanpur': [27.4167, 85.0333], 'Dang': [28.0000, 82.3000], 'Banke': [28.0500, 81.6167],
        'Surkhet': [28.6000, 81.6333], 'Kailali': [28.7000, 80.5833], 'Kanchanpur': [28.9667, 80.1833],
        'Baglung': [28.2733, 83.5900], 'Dhanusha': [26.7167, 85.9167], 'Saptari': [26.5833, 86.7500],
        'Siraha': [26.6500, 86.2000], 'Palpa': [27.8667, 83.5500], 'Dhankuta': [26.9833, 87.3333],
        'Ilam': [26.9117, 87.9239], 'Syangja': [28.1000, 83.8667], 'Tanahun': [27.9167, 84.2833]
      }
      
      const district = districts.find((d:any) => d.id.toString() === districtId.toString())
      const name = district?.name_en
      if (name && majorCenters[name]) {
        mapRef.current?.flyTo(majorCenters[name], 11, { duration: 1.5 })
      }
    }
  }

  const [locating, setLocating] = useState(false)
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported')
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: 1.5 })
        setLocating(false)
      },
      () => {
        setLocating(false)
        alert('Could not get your location')
      }
    )
  }

  return (
    <div className="w-full h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] z-0 absolute top-0 left-0 right-0 touch-none">
      {/* Search & Location Bar (Professional Floating Bar) */}
      <div className="absolute top-24 left-4 right-4 md:left-auto md:right-4 md:w-80 z-[1000] space-y-3 pointer-events-none">
         
         <div className="bg-white/95 backdrop-blur-xl p-4 md:p-5 rounded-[2rem] shadow-2xl shadow-blue-900/10 border border-white pointer-events-auto flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="p-1.5 bg-blue-50 text-blue-600 rounded-xl">
                   <Search className="w-4 h-4" />
                 </div>
                 <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">Find Places</h4>
              </div>
              <button 
                onClick={handleUseMyLocation}
                disabled={locating}
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-600/20 transition active:scale-90 disabled:opacity-50"
                title="Use My Location"
              >
                {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 fill-white" />}
              </button>
            </div>
            
            <div className="relative group">
               <select 
                onChange={handleDistrictChange}
                className="w-full bg-gray-50/80 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer appearance-none"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
               >
                <option value="">Jump to District</option>
                {districts?.map((d: any) => (
                  <option key={d.id} value={d.id}>{d.name_en}</option>
                ))}
               </select>
            </div>
         </div>
         
         <div className="bg-blue-600/90 backdrop-blur-md px-5 py-2 rounded-full shadow-lg text-[10px] font-black text-white self-end inline-flex items-center gap-2 tracking-[0.2em] uppercase float-right border border-white/20">
           <MapPin className="w-3 h-3 text-white fill-white animate-pulse" />
           {businesses.filter((b:any)=>b.latitude && b.longitude).length} Local Markers
         </div>
      </div>

      <MapContainer 
        center={defaultCenter} 
        zoom={7} 
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        touchZoom={true}
        dragging={true}
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        {onBoundsChange && <MapTracker setBounds={onBoundsChange} mapRef={mapRef} />}

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
                        href={`/${business.slug}`} 
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
