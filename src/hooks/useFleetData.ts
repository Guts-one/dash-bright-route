import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Truck, Customer, Route, GpsEvent, Delivery, MaintenanceAlert, RouteDeviationEvent, FleetStats, Checkpoint } from '@/lib/types';
import { deriveTruckStatus } from '@/lib/fleet-utils';
import { useEffect } from 'react';

// Fetch all trucks with derived status
export function useTrucks() {
  const { data: customers } = useCustomers();

  return useQuery({
    queryKey: ['trucks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trucks')
        .select(`
          *,
          profiles:driver_id (name)
        `)
        .order('name');
      
      if (error) throw error;
      
      // Add derived status
      return (data || []).map((truck: any) => ({
        ...truck,
        driver_name: truck.profiles?.name,
        status: deriveTruckStatus(truck, customers || [])
      })) as Truck[];
    },
    enabled: !!customers,
  });
}

// Fetch all customers
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Customer[];
    },
  });
}

// Fetch today's routes
export function useTodaysRoutes() {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['routes', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('date', today);
      
      if (error) throw error;
      return (data || []).map((route: any) => ({
        ...route,
        planned_path: route.planned_path as Checkpoint[]
      })) as Route[];
    },
  });
}

// Fetch route for specific truck
export function useTruckRoute(truckId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['routes', truckId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .eq('truck_id', truckId)
        .eq('date', today)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      
      return {
        ...data,
        planned_path: (data.planned_path as unknown) as Checkpoint[]
      } as Route;
    },
    enabled: !!truckId,
  });
}

// Fetch GPS events for a truck
export function useGpsEvents(truckId: string, limit: number = 100) {
  return useQuery({
    queryKey: ['gps_events', truckId, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gps_events')
        .select('*')
        .eq('truck_id', truckId)
        .order('ts', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as GpsEvent[];
    },
    enabled: !!truckId,
  });
}

// Fetch deliveries
export function useDeliveries(filters?: { truckId?: string; status?: string; today?: boolean }) {
  return useQuery({
    queryKey: ['deliveries', filters],
    queryFn: async () => {
      let query = supabase
        .from('deliveries')
        .select(`
          *,
          customer:customers(*),
          truck:trucks(id, name, plate)
        `)
        .order('stop_order');
      
      if (filters?.truckId) {
        query = query.eq('truck_id', filters.truckId);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.today) {
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('created_at', today);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Delivery[];
    },
  });
}

// Fetch driver's deliveries
export function useDriverDeliveries(driverId: string) {
  const today = new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['driver_deliveries', driverId, today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('deliveries')
        .select(`
          *,
          customer:customers(*)
        `)
        .eq('driver_id', driverId)
        .gte('created_at', today)
        .order('stop_order');
      
      if (error) throw error;
      return data as Delivery[];
    },
    enabled: !!driverId,
  });
}

// Fetch maintenance alerts
export function useMaintenanceAlerts(resolved?: boolean) {
  return useQuery({
    queryKey: ['maintenance_alerts', resolved],
    queryFn: async () => {
      let query = supabase
        .from('maintenance_alerts')
        .select(`
          *,
          truck:trucks(id, name, plate),
          rule:maintenance_rules(type, interval_km, interval_days)
        `)
        .order('created_ts', { ascending: false });
      
      if (resolved === false) {
        query = query.is('resolved_ts', null);
      } else if (resolved === true) {
        query = query.not('resolved_ts', 'is', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MaintenanceAlert[];
    },
  });
}

// Fetch route deviation events
export function useRouteDeviations(active?: boolean) {
  return useQuery({
    queryKey: ['route_deviations', active],
    queryFn: async () => {
      let query = supabase
        .from('route_deviation_events')
        .select(`
          *,
          truck:trucks(id, name, plate)
        `)
        .order('start_ts', { ascending: false });
      
      if (active) {
        query = query.is('end_ts', null);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RouteDeviationEvent[];
    },
  });
}

// Fleet statistics
export function useFleetStats(): { data: FleetStats | undefined; isLoading: boolean } {
  const { data: trucks, isLoading: trucksLoading } = useTrucks();
  const { data: alerts, isLoading: alertsLoading } = useMaintenanceAlerts(false);
  const { data: deviations, isLoading: deviationsLoading } = useRouteDeviations(true);
  const { data: deliveries, isLoading: deliveriesLoading } = useDeliveries({ today: true });

  const isLoading = trucksLoading || alertsLoading || deviationsLoading || deliveriesLoading;

  if (isLoading || !trucks) {
    return { data: undefined, isLoading };
  }

  const stats: FleetStats = {
    totalTrucks: trucks.length,
    enRoute: trucks.filter(t => t.status === 'en_route').length,
    stopped: trucks.filter(t => t.status === 'stopped').length,
    atCustomer: trucks.filter(t => t.status === 'at_customer').length,
    offline: trucks.filter(t => t.status === 'offline').length,
    maintenanceAlerts: alerts?.length || 0,
    activeDeviations: deviations?.length || 0,
    pendingDeliveries: deliveries?.filter(d => d.status === 'pending' || d.status === 'in_progress').length || 0,
    completedToday: deliveries?.filter(d => d.status === 'completed').length || 0,
  };

  return { data: stats, isLoading: false };
}

// Update delivery
export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Delivery> }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['driver_deliveries'] });
    },
  });
}

// Real-time subscriptions hook
export function useFleetRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('fleet-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trucks' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['trucks'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deliveries' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['deliveries'] });
          queryClient.invalidateQueries({ queryKey: ['driver_deliveries'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_alerts' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['maintenance_alerts'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gps_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['gps_events'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'route_deviation_events' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['route_deviations'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
