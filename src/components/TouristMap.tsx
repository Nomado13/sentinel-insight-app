import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, AlertTriangle, User } from 'lucide-react';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Tourist {
  id: string;
  tourist_id: string;
  name: string;
  passport_number: string;
  emergency_contact: string;
  trip_start: string;
  trip_end: string;
  status: string;
  latitude: number;
  longitude: number;
  location_name: string;
}

interface AlertItem {
  id: string;
  tourist_id: string;
  type: 'panic' | 'inactivity';
  message: string;
  latitude: number;
  longitude: number;
  location_name: string;
  severity: 'low' | 'medium' | 'high';
  status: string;
  created_at: string;
}

interface Props {
  tourists: Tourist[];
  alerts: AlertItem[];
  onTouristClick: (tourist: Tourist) => void;
}

export const TouristMap: React.FC<Props> = ({ tourists, alerts, onTouristClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([28.6139, 77.2090], 10); // New Delhi coordinates

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;
    
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Create custom icons
    const createTouristIcon = (hasAlert: boolean, alertSeverity?: string) => {
      const color = hasAlert 
        ? (alertSeverity === 'high' ? '#ef4444' : '#f59e0b') 
        : '#37a7eb';
      
      return L.divIcon({
        html: `
          <div style="
            background-color: ${color};
            width: 30px;
            height: 30px;
            border-radius: 50%;
            border: 3px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            ${hasAlert ? 'animation: pulse 2s infinite;' : ''}
          ">
            <svg width="16" height="16" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 7.5V9M15 11.5V9.5L21 9V11H15.5C15.5 11.2 15.5 11.3 15.5 11.5M11 14V8H13V14H11ZM8 10V12H10V10H8ZM10 8V6H8V8H10Z"/>
            </svg>
          </div>
        `,
        className: 'custom-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
    };

    // Add tourist markers
    tourists.forEach((tourist) => {
      if (tourist.latitude && tourist.longitude) {
        const touristAlerts = alerts.filter(alert => alert.tourist_id === tourist.tourist_id);
        const hasAlert = touristAlerts.length > 0;
        const highestSeverity = hasAlert 
          ? touristAlerts.reduce((max, alert) => 
              alert.severity === 'high' ? 'high' : (max === 'high' ? 'high' : alert.severity), 'low')
          : undefined;

        const marker = L.marker([tourist.latitude, tourist.longitude], {
          icon: createTouristIcon(hasAlert, highestSeverity)
        }).addTo(map);

        // Create popup content
        const popupContent = `
          <div style="min-width: 200px; padding: 8px;">
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <div style="background: #37a7eb; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
                <svg width="12" height="12" fill="white" viewBox="0 0 24 24">
                  <path d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"/>
                </svg>
              </div>
              <div>
                <h4 style="margin: 0; font-weight: 600; color: #1e293b;">${tourist.name}</h4>
                <p style="margin: 0; font-size: 12px; color: #64748b;">ID: ${tourist.tourist_id}</p>
              </div>
            </div>
            
            <div style="margin-bottom: 8px;">
              <p style="margin: 0; font-size: 13px; color: #475569;">
                <strong>Location:</strong> ${tourist.location_name || 'Unknown'}
              </p>
              <p style="margin: 0; font-size: 13px; color: #475569;">
                <strong>Status:</strong> 
                <span style="color: ${tourist.status === 'active' ? '#059669' : '#dc2626'}; font-weight: 500;">
                  ${tourist.status}
                </span>
              </p>
            </div>
            
            ${hasAlert ? `
              <div style="background: ${highestSeverity === 'high' ? '#fee2e2' : '#fef3c7'}; padding: 6px; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid ${highestSeverity === 'high' ? '#ef4444' : '#f59e0b'};">
                <p style="margin: 0; font-size: 12px; color: ${highestSeverity === 'high' ? '#991b1b' : '#92400e'}; font-weight: 500;">
                  ${touristAlerts.length} Active Alert${touristAlerts.length > 1 ? 's' : ''}
                </p>
              </div>
            ` : ''}
            
            <button 
              onclick="window.selectTourist('${tourist.tourist_id}')"
              style="
                background: #37a7eb;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                width: 100%;
                font-weight: 500;
              "
              onmouseover="this.style.background='#2563eb'"
              onmouseout="this.style.background='#37a7eb'"
            >
              View Details
            </button>
          </div>
        `;

        marker.bindPopup(popupContent);
      }
    });

    // Add global function to handle tourist selection
    (window as any).selectTourist = (touristId: string) => {
      const tourist = tourists.find(t => t.tourist_id === touristId);
      if (tourist) {
        onTouristClick(tourist);
      }
    };

    // Fit map to show all markers if tourists exist
    if (tourists.length > 0) {
      const validTourists = tourists.filter(t => t.latitude && t.longitude);
      if (validTourists.length > 0) {
        const group = new L.FeatureGroup(
          validTourists.map(tourist => 
            L.marker([tourist.latitude, tourist.longitude])
          )
        );
        map.fitBounds(group.getBounds().pad(0.1));
      }
    }

  }, [tourists, alerts, onTouristClick]);

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className="w-full h-96 rounded-lg border border-border shadow-sm"
        style={{ minHeight: '400px' }}
      />
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-card border border-border rounded-lg p-3 shadow-card">
        <h4 className="font-semibold text-sm text-foreground mb-2">Legend</h4>
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-authority border-2 border-white"></div>
            <span className="text-xs text-muted-foreground">Active Tourist</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-alert-warning border-2 border-white"></div>
            <span className="text-xs text-muted-foreground">Inactivity Alert</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-alert-critical border-2 border-white animate-pulse"></div>
            <span className="text-xs text-muted-foreground">Panic Alert</span>
          </div>
        </div>
      </div>

      {/* Tourist Count */}
      <div className="absolute top-4 right-4 bg-card border border-border rounded-lg p-3 shadow-card">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-authority" />
          <span className="text-sm font-medium text-foreground">
            {tourists.length} Tourist{tourists.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};