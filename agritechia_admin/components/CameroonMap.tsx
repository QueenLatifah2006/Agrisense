'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default Leaflet marker icons in Next.js
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const iconUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom colored markers for Prices
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-colored-marker',
    html: `<div style="background-color: ${color}; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

const redIcon = createColoredIcon('#e11d48'); // rose-600
const orangeIcon = createColoredIcon('#f97316'); // orange-500
const greenIcon = createColoredIcon('#22c55e'); // green-500

interface MapProps {
  marketsData: any[]; // Array of markets with prices and coords
  cropName: string;
  averagePrice: number;
}

export default function CameroonMap({ marketsData, cropName, averagePrice }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const marketPoints = useMemo(() => {
    if (!marketsData) return [];
    
    return marketsData.map((m, index) => {
      const price = m.price || averagePrice || 0;
      
      let icon = orangeIcon;
      if (averagePrice > 0) {
        if (price > averagePrice * 1.1) icon = redIcon;
        else if (price < averagePrice * 0.9) icon = greenIcon;
      }
      
      const coords = m.coords || [7.3697, 12.3547];
      
      return {
        id: m.id || `m-${index}`,
        name: m.name || m.market || `Marché ${index}`,
        price: price,
        coords: coords,
        icon: icon
      };
    });
  }, [marketsData, averagePrice]);

  const center: [number, number] = [7.3697, 12.3547];

  if (!isMounted) {
    return (
      <div className="w-full h-full absolute inset-0 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-800 animate-pulse flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full h-full absolute inset-0 rounded-lg overflow-hidden border border-slate-200 dark:border-zinc-800">
      <MapContainer
        center={center} 
        zoom={5} 
        style={{ height: '100%', width: '100%', background: '#f8fafc' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap contributors'
        />

        {marketPoints.map((mp) => (
          <Marker key={mp.id} position={mp.coords} icon={mp.icon}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1} className="font-sans">
              <div className="text-center p-1">
                <p className="font-bold text-slate-900">{mp.name}</p>
                <p className="text-xs text-slate-600">{cropName}</p>
                <p className="text-sm font-extrabold text-rose-600 mt-1">{mp.price.toLocaleString('fr-FR')} FCFA / kg</p>
              </div>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend Override Overlay */}
      <div className="absolute bottom-4 left-4 z-[400] bg-white/90 dark:bg-zinc-900/90 p-2 rounded shadow text-xs border border-slate-200 dark:border-zinc-700 backdrop-blur-sm pointer-events-none">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center"><div className="w-3 h-3 bg-rose-600 rounded-full mr-2 shadow-sm border border-white"></div> Prix Élevé</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-orange-500 rounded-full mr-2 shadow-sm border border-white"></div> Prix Moyen</div>
          <div className="flex items-center"><div className="w-3 h-3 bg-green-500 rounded-full mr-2 shadow-sm border border-white"></div> Prix Bas</div>
        </div>
      </div>
      
    </div>
  );
}
