import { Truck, Customer, Checkpoint, TruckStatus, IssueCategory, MaintenanceType } from './types';

// Calculate distance between two points in meters (Haversine formula)
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// Derive truck status based on location and speed
export function deriveTruckStatus(
  truck: Truck,
  customers: Customer[],
  activeRouteCustomerIds?: string[]
): TruckStatus {
  // Check if we have recent GPS data (within 5 minutes)
  if (!truck.last_lat || !truck.last_lng || !truck.last_update_ts) {
    return 'offline';
  }

  const lastUpdate = new Date(truck.last_update_ts);
  const now = new Date();
  const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / 1000 / 60;

  if (minutesSinceUpdate > 5) {
    return 'offline';
  }

  // Check if at any customer on the active route
  const routeCustomers = activeRouteCustomerIds
    ? customers.filter((c) => activeRouteCustomerIds.includes(c.id))
    : customers;

  for (const customer of routeCustomers) {
    const distance = calculateDistance(
      truck.last_lat,
      truck.last_lng,
      customer.lat,
      customer.lng
    );
    if (distance <= customer.geofence_radius_m) {
      return 'at_customer';
    }
  }

  // Check speed
  if (truck.last_speed && truck.last_speed > 5) {
    return 'en_route';
  }

  return 'stopped';
}

// Check if truck is deviating from planned route
export function checkRouteDeviation(
  truckLat: number,
  truckLng: number,
  plannedPath: Checkpoint[],
  thresholdMeters: number = 500
): { isDeviating: boolean; distanceFromRoute: number } {
  if (plannedPath.length === 0) {
    return { isDeviating: false, distanceFromRoute: 0 };
  }

  // Find minimum distance to any checkpoint or segment
  let minDistance = Infinity;

  for (let i = 0; i < plannedPath.length; i++) {
    const checkpoint = plannedPath[i];
    const distance = calculateDistance(truckLat, truckLng, checkpoint.lat, checkpoint.lng);
    minDistance = Math.min(minDistance, distance);

    // Also check distance to segment between this and next checkpoint
    if (i < plannedPath.length - 1) {
      const next = plannedPath[i + 1];
      const segmentDistance = pointToSegmentDistance(
        truckLat,
        truckLng,
        checkpoint.lat,
        checkpoint.lng,
        next.lat,
        next.lng
      );
      minDistance = Math.min(minDistance, segmentDistance);
    }
  }

  return {
    isDeviating: minDistance > thresholdMeters,
    distanceFromRoute: minDistance,
  };
}

// Calculate distance from point to line segment
function pointToSegmentDistance(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;

  if (lenSq !== 0) {
    param = dot / lenSq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  return calculateDistance(px, py, xx, yy);
}

// Check maintenance status
export function checkMaintenanceStatus(
  currentOdometer: number,
  lastServiceKm: number,
  lastServiceDate: string,
  intervalKm: number,
  intervalDays: number
): { status: 'ok' | 'due_soon' | 'overdue'; kmRemaining: number; daysRemaining: number } {
  const kmSinceService = currentOdometer - lastServiceKm;
  const kmRemaining = intervalKm - kmSinceService;

  const lastDate = new Date(lastServiceDate);
  const now = new Date();
  const daysSinceService = Math.floor((now.getTime() - lastDate.getTime()) / 1000 / 60 / 60 / 24);
  const daysRemaining = intervalDays - daysSinceService;

  if (kmRemaining <= 0 || daysRemaining <= 0) {
    return { status: 'overdue', kmRemaining, daysRemaining };
  }

  if (kmRemaining <= 500 || daysRemaining <= 7) {
    return { status: 'due_soon', kmRemaining, daysRemaining };
  }

  return { status: 'ok', kmRemaining, daysRemaining };
}

// Format relative time
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Agora mesmo';
  if (diffMinutes < 60) return `ha ${diffMinutes} min`;
  if (diffHours < 24) return `ha ${diffHours} h`;
  return `ha ${diffDays} d`;
}

// Format status for display
export function formatStatus(status: TruckStatus): string {
  switch (status) {
    case 'en_route':
      return 'Em rota';
    case 'stopped':
      return 'Parado';
    case 'at_customer':
      return 'No cliente';
    case 'offline':
      return 'Offline';
    default:
      return status;
  }
}

// Get status CSS class
export function getStatusClass(status: TruckStatus): string {
  switch (status) {
    case 'en_route':
      return 'status-en-route';
    case 'stopped':
      return 'status-stopped';
    case 'at_customer':
      return 'status-at-customer';
    case 'offline':
      return 'status-offline';
    default:
      return '';
  }
}

const issueCategoryLabels: Record<IssueCategory, string> = {
  damage: 'dano',
  refused: 'cliente recusou',
  missing_items: 'itens faltando',
  other: 'outro',
};

export function formatIssueCategory(category?: IssueCategory | string | null): string {
  if (!category) return 'outro';
  if ((category as IssueCategory) in issueCategoryLabels) {
    return issueCategoryLabels[category as IssueCategory];
  }
  return String(category).replace(/_/g, ' ');
}

const maintenanceTypeLabels: Record<MaintenanceType, string> = {
  oil: 'oleo',
  tires: 'pneus',
  inspection: 'inspecao',
  brakes: 'freios',
  filters: 'filtros',
  transmission: 'transmissao',
};

export function formatMaintenanceType(type?: MaintenanceType | string | null): string {
  if (!type) return 'manutencao';
  if ((type as MaintenanceType) in maintenanceTypeLabels) {
    return maintenanceTypeLabels[type as MaintenanceType];
  }
  return String(type);
}

// Generate random coordinates near a center point
export function generateRandomCoordinate(
  centerLat: number,
  centerLng: number,
  radiusKm: number
): { lat: number; lng: number } {
  const radiusInDegrees = radiusKm / 111; // Approximate conversion
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);

  return {
    lat: centerLat + y,
    lng: centerLng + x / Math.cos(toRad(centerLat)),
  };
}

// Move coordinate towards target
export function moveTowards(
  currentLat: number,
  currentLng: number,
  targetLat: number,
  targetLng: number,
  distanceMeters: number
): { lat: number; lng: number } {
  const totalDistance = calculateDistance(currentLat, currentLng, targetLat, targetLng);
  
  if (totalDistance <= distanceMeters) {
    return { lat: targetLat, lng: targetLng };
  }

  const ratio = distanceMeters / totalDistance;
  return {
    lat: currentLat + (targetLat - currentLat) * ratio,
    lng: currentLng + (targetLng - currentLng) * ratio,
  };
}
