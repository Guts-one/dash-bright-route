// Fleet Tracking Types

export type UserRole = 'manager' | 'driver';

export type TruckStatus = 'en_route' | 'stopped' | 'at_customer' | 'offline';

export type DeliveryStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export type MaintenanceType = 'oil' | 'tires' | 'inspection' | 'brakes' | 'filters' | 'transmission';

export type AlertSeverity = 'due_soon' | 'overdue';

export type IssueCategory = 'damage' | 'refused' | 'missing_items' | 'other';

export type DelayReason = 'traffic' | 'queue' | 'loading' | 'roadwork' | 'other';

export interface Checkpoint {
  lat: number;
  lng: number;
  order: number;
  customer_id?: string;
}

export interface Profile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  geofence_radius_m: number;
  created_at: string;
}

export interface Truck {
  id: string;
  plate: string;
  name: string;
  driver_id?: string;
  last_lat?: number;
  last_lng?: number;
  last_update_ts?: string;
  last_speed?: number;
  odometer_km: number;
  fuel_used_l: number;
  created_at: string;
  // Computed
  status?: TruckStatus;
  driver_name?: string;
}

export interface Route {
  id: string;
  truck_id: string;
  date: string;
  planned_path: Checkpoint[];
  created_at: string;
}

export interface GpsEvent {
  id: string;
  truck_id: string;
  ts: string;
  lat: number;
  lng: number;
  speed: number;
}

export interface Delivery {
  id: string;
  route_id: string;
  customer_id: string;
  truck_id: string;
  driver_id?: string;
  status: DeliveryStatus;
  stop_order: number;
  completed_ts?: string;
  signature_url?: string;
  issue_category?: IssueCategory;
  issue_notes?: string;
  delay_reason?: string;
  created_at: string;
  // Joined
  customer?: Customer;
  truck?: Truck;
  driver?: Profile;
}

export interface MaintenanceRule {
  id: string;
  truck_id: string;
  type: MaintenanceType;
  interval_km: number;
  interval_days: number;
  last_service_km: number;
  last_service_date: string;
  created_at: string;
}

export interface MaintenanceAlert {
  id: string;
  truck_id: string;
  rule_id: string;
  severity: AlertSeverity;
  message: string;
  created_ts: string;
  resolved_ts?: string;
  // Joined
  truck?: Truck;
  rule?: MaintenanceRule;
}

export interface RouteDeviationEvent {
  id: string;
  truck_id: string;
  route_id: string;
  start_ts: string;
  end_ts?: string;
  max_distance_m: number;
  notes?: string;
  // Joined
  truck?: Truck;
}

// Dashboard stats
export interface FleetStats {
  totalTrucks: number;
  enRoute: number;
  stopped: number;
  atCustomer: number;
  offline: number;
  maintenanceAlerts: number;
  activeDeviations: number;
  pendingDeliveries: number;
  completedToday: number;
}
