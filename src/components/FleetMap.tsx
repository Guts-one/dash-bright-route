import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Customer, GpsEvent, Checkpoint, TruckStatus } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from '@/lib/fleet-utils';

// Fix default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom truck marker
function createTruckIcon(status: TruckStatus, label: string) {
  const colors: Record<TruckStatus, string> = {
    en_route: '#0d9488', // teal
    stopped: '#f59e0b', // amber
    at_customer: '#22c55e', // green
    offline: '#6b7280', // gray
  };

  const color = colors[status] || colors.offline;

  return L.divIcon({
    className: 'truck-marker-icon',
    html: `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">${label}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// Customer marker
function createCustomerIcon() {
  return L.divIcon({
    className: 'customer-marker-icon',
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: #3b82f6;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        border: 2px solid white;
      ">📍</div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
}

interface FleetMapProps {
  trucks: Truck[];
  customers?: Customer[];
  selectedTruckId?: string;
  gpsHistory?: GpsEvent[];
  plannedPath?: Checkpoint[];
  showCustomers?: boolean;
  onTruckClick?: (truck: Truck) => void;
  className?: string;
}

// Component to auto-fit bounds
function MapBounds({ trucks, selectedTruckId }: { trucks: Truck[]; selectedTruckId?: string }) {
  const map = useMap();
  const initialFitDone = useRef(false);

  useEffect(() => {
    if (trucks.length === 0) return;

    const validTrucks = trucks.filter(t => t.last_lat && t.last_lng);
    if (validTrucks.length === 0) return;

    // If a truck is selected, center on it
    if (selectedTruckId) {
      const selected = validTrucks.find(t => t.id === selectedTruckId);
      if (selected && selected.last_lat && selected.last_lng) {
        map.setView([selected.last_lat, selected.last_lng], 14);
        return;
      }
    }

    // Only auto-fit on initial load
    if (!initialFitDone.current) {
      const bounds = L.latLngBounds(
        validTrucks.map(t => [t.last_lat!, t.last_lng!] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
      initialFitDone.current = true;
    }
  }, [trucks, selectedTruckId, map]);

  return null;
}

export function FleetMap({
  trucks,
  customers = [],
  selectedTruckId,
  gpsHistory = [],
  plannedPath = [],
  showCustomers = true,
  onTruckClick,
  className,
}: FleetMapProps) {
  // Default center (San Francisco area)
  const defaultCenter: [number, number] = [37.7749, -122.4194];

  // Determine center based on truck data
  const validTrucks = trucks.filter(t => t.last_lat && t.last_lng);
  const center = validTrucks.length > 0
    ? [validTrucks[0].last_lat!, validTrucks[0].last_lng!] as [number, number]
    : defaultCenter;

  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={12}
        style={{ width: '100%', height: '100%', minHeight: '400px' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapBounds trucks={trucks} selectedTruckId={selectedTruckId} />

        {/* Planned path polyline */}
        {plannedPath.length > 1 && (
          <Polyline
            positions={plannedPath.map(p => [p.lat, p.lng] as [number, number])}
            color="#3b82f6"
            weight={3}
            opacity={0.7}
            dashArray="10, 10"
          />
        )}

        {/* GPS history polyline */}
        {gpsHistory.length > 1 && (
          <Polyline
            positions={gpsHistory.map(e => [e.lat, e.lng] as [number, number]).reverse()}
            color="#0d9488"
            weight={3}
            opacity={0.8}
          />
        )}

        {/* Customer geofences */}
        {showCustomers && customers.map((customer) => (
          <Circle
            key={`geofence-${customer.id}`}
            center={[customer.lat, customer.lng]}
            radius={customer.geofence_radius_m}
            fillColor="#3b82f6"
            fillOpacity={0.1}
            color="#3b82f6"
            weight={1}
          />
        ))}

        {/* Customer markers */}
        {showCustomers && customers.map((customer) => (
          <Marker
            key={`marker-${customer.id}`}
            position={[customer.lat, customer.lng]}
            icon={createCustomerIcon()}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-semibold">{customer.name}</p>
                {customer.address && (
                  <p className="text-muted-foreground text-xs">{customer.address}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Truck markers */}
        {trucks.map((truck) => {
          if (!truck.last_lat || !truck.last_lng) return null;

          const label = truck.name.substring(0, 3).toUpperCase();
          const isSelected = truck.id === selectedTruckId;

          return (
            <Marker
              key={truck.id}
              position={[truck.last_lat, truck.last_lng]}
              icon={createTruckIcon(truck.status || 'offline', label)}
              eventHandlers={{
                click: () => onTruckClick?.(truck),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{truck.name}</span>
                    <StatusBadge status={truck.status || 'offline'} type="truck" size="sm" />
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Placa: {truck.plate}</p>
                    {truck.driver_name && <p>Motorista: {truck.driver_name}</p>}
                    {truck.last_speed !== undefined && <p>Velocidade: {Math.round(truck.last_speed)} km/h</p>}
                    {truck.last_update_ts && (
                      <p>Atualizado: {formatRelativeTime(truck.last_update_ts)}</p>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
