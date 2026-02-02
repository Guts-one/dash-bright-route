import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { formatMaintenanceType, generateRandomCoordinate, moveTowards, calculateDistance } from '@/lib/fleet-utils';
import { Truck, Customer, Route, Checkpoint } from '@/lib/types';
import { toast } from 'sonner';

interface SimulationState {
  isRunning: boolean;
  currentStep: number;
  totalSteps: number;
  logs: string[];
}

export function useDemoSimulation() {
  const queryClient = useQueryClient();
  const [state, setState] = useState<SimulationState>({
    isRunning: false,
    currentStep: 0,
    totalSteps: 9,
    logs: [],
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const trucksRef = useRef<Truck[]>([]);
  const customersRef = useRef<Customer[]>([]);
  const routesRef = useRef<Route[]>([]);

  const addLog = useCallback((message: string) => {
    setState(prev => ({
      ...prev,
      logs: [...prev.logs.slice(-19), `[${new Date().toLocaleTimeString()}] ${message}`],
    }));
  }, []);

  const updateTruckPosition = useCallback(async (truckId: string, lat: number, lng: number, speed: number) => {
    // Update truck position
    await supabase
      .from('trucks')
      .update({
        last_lat: lat,
        last_lng: lng,
        last_speed: speed,
        last_update_ts: new Date().toISOString(),
        odometer_km: supabase.rpc ? undefined : undefined, // Would need RPC for increment
      })
      .eq('id', truckId);

    // Add GPS event
    await supabase
      .from('gps_events')
      .insert({
        truck_id: truckId,
        lat,
        lng,
        speed,
        ts: new Date().toISOString(),
      });
  }, []);

  const triggerDeviation = useCallback(async (truck: Truck, route: Route) => {
    if (!truck.last_lat || !truck.last_lng) return;
    
    // Create a deviation event
    const { data } = await supabase
      .from('route_deviation_events')
      .insert({
        truck_id: truck.id,
        route_id: route.id,
        max_distance_m: 750 + Math.random() * 500,
        notes: 'Desvio de rota simulado detectado',
      })
      .select()
      .single();
    
    if (data) {
      addLog(`⚠️ Route deviation detected for ${truck.name}`);
      toast.warning(`Route Deviation: ${truck.name}`, {
        description: 'Truck has deviated from planned route',
      });
    }
  }, [addLog]);

  const triggerMaintenanceAlert = useCallback(async (truck: Truck) => {
    // Get a rule for this truck
    const { data: rules } = await supabase
      .from('maintenance_rules')
      .select('*')
      .eq('truck_id', truck.id)
      .limit(1);

    if (!rules || rules.length === 0) return;

    const rule = rules[0];
    
    // Check if there's already an alert for this rule
    const { data: existingAlert } = await supabase
      .from('maintenance_alerts')
      .select('*')
      .eq('rule_id', rule.id)
      .is('resolved_ts', null)
      .single();

    if (existingAlert) {
      // Upgrade to overdue if it was due_soon
      if (existingAlert.severity === 'due_soon') {
        await supabase
          .from('maintenance_alerts')
          .update({
            severity: 'overdue',
            message: `ATRASADO: manutencao de ${formatMaintenanceType(rule.type)} necessaria para ${truck.name}`,
          })
          .eq('id', existingAlert.id);
        
        addLog(`🔴 Maintenance alert escalated to OVERDUE for ${truck.name}`);
        toast.error(`Manutencao atrasada: ${truck.name}`, {
          description: `Manutencao de ${formatMaintenanceType(rule.type)} agora esta atrasada`,
        });
      }
    } else {
      // Create new alert
      await supabase
        .from('maintenance_alerts')
        .insert({
          truck_id: truck.id,
          rule_id: rule.id,
          severity: 'due_soon',
          message: `Manutencao de ${formatMaintenanceType(rule.type)} vence em breve para ${truck.name}`,
        });
      
      addLog(`🟡 Maintenance alert created for ${truck.name}`);
      toast.warning(`Manutencao a vencer: ${truck.name}`, {
        description: `Manutencao de ${formatMaintenanceType(rule.type)} vence em breve`,
      });
    }
  }, [addLog]);

  const completeDelivery = useCallback(async (withIssue: boolean) => {
    // Find a pending delivery
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*, customer:customers(*), truck:trucks(*)')
      .eq('status', 'pending')
      .limit(1);

    if (!deliveries || deliveries.length === 0) return;

    const delivery = deliveries[0];
    const customer = delivery.customer;

    if (withIssue) {
      await supabase
        .from('deliveries')
        .update({
          status: 'failed',
          completed_ts: new Date().toISOString(),
          issue_category: 'refused',
          issue_notes: 'Customer refused delivery - simulated issue',
        })
        .eq('id', delivery.id);
      
      addLog(`❌ Delivery failed at ${customer?.name || 'customer'} (refused)`);
      toast.error('Delivery Issue', {
        description: `${customer?.name}: Customer refused delivery`,
      });
    } else {
      // Create a fake signature URL
      const signatureUrl = `https://picsum.photos/seed/${Date.now()}/300/100`;
      
      await supabase
        .from('deliveries')
        .update({
          status: 'completed',
          completed_ts: new Date().toISOString(),
          signature_url: signatureUrl,
        })
        .eq('id', delivery.id);
      
      addLog(`✅ Delivery completed at ${customer?.name || 'customer'}`);
      toast.success('Delivery Completed', {
        description: `${customer?.name}: Signature captured`,
      });
    }
  }, [addLog]);

  const runSimulationStep = useCallback(async (step: number) => {
    const trucks = trucksRef.current.slice(0, 3); // Simulate 3 trucks
    const routes = routesRef.current;

    setState(prev => ({ ...prev, currentStep: step }));

    // Move trucks
    for (const truck of trucks) {
      if (!truck.last_lat || !truck.last_lng) continue;

      const route = routes.find(r => r.truck_id === truck.id);
      if (!route || !route.planned_path || route.planned_path.length === 0) continue;

      const path = route.planned_path as Checkpoint[];
      
      // Move towards next checkpoint
      const currentCheckpoint = Math.min(step % path.length, path.length - 1);
      const target = path[currentCheckpoint];
      
      const newPos = moveTowards(
        truck.last_lat,
        truck.last_lng,
        target.lat,
        target.lng,
        500 + Math.random() * 300 // 500-800 meters per step
      );

      const speed = 40 + Math.random() * 30; // 40-70 km/h
      await updateTruckPosition(truck.id, newPos.lat, newPos.lng, speed);
      
      // Update local reference
      truck.last_lat = newPos.lat;
      truck.last_lng = newPos.lng;

      addLog(`🚚 ${truck.name} moved to (${newPos.lat.toFixed(4)}, ${newPos.lng.toFixed(4)})`);
    }

    // Step-specific events
    if (step === 3 && trucks.length > 0 && routes.length > 0) {
      const truck = trucks[0];
      const route = routes.find(r => r.truck_id === truck.id);
      if (route) {
        await triggerDeviation(truck, route);
      }
    }

    if (step === 5 && trucks.length > 1) {
      await triggerMaintenanceAlert(trucks[1]);
    }

    if (step === 6) {
      await completeDelivery(false); // Complete with signature
    }

    if (step === 8) {
      await completeDelivery(true); // Complete with issue
    }

    // Invalidate queries to refresh UI
    queryClient.invalidateQueries({ queryKey: ['trucks'] });
    queryClient.invalidateQueries({ queryKey: ['gps_events'] });
    queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    queryClient.invalidateQueries({ queryKey: ['maintenance_alerts'] });
    queryClient.invalidateQueries({ queryKey: ['route_deviations'] });
  }, [updateTruckPosition, triggerDeviation, triggerMaintenanceAlert, completeDelivery, addLog, queryClient]);

  const startSimulation = useCallback(async () => {
    // Fetch current data
    const { data: trucks } = await supabase.from('trucks').select('*');
    const { data: customers } = await supabase.from('customers').select('*');
    const today = new Date().toISOString().split('T')[0];
    const { data: routes } = await supabase.from('routes').select('*').eq('date', today);

    if (!trucks || trucks.length === 0) {
      toast.error('No trucks found', { description: 'Please seed the database first' });
      return;
    }

    trucksRef.current = trucks as Truck[];
    customersRef.current = (customers || []) as Customer[];
    routesRef.current = (routes || []).map(r => ({
      ...r,
      planned_path: (r.planned_path as unknown) as Checkpoint[]
    })) as Route[];

    setState({
      isRunning: true,
      currentStep: 0,
      totalSteps: 9,
      logs: ['🚀 Starting demo simulation...'],
    });

    toast.info('Demo Simulation Started', {
      description: 'Watch the dashboard update in real-time!',
    });

    let step = 0;
    intervalRef.current = setInterval(async () => {
      if (step >= 9) {
        stopSimulation();
        return;
      }
      await runSimulationStep(step);
      step++;
    }, 8000); // 8 seconds per step (~72 seconds total)
  }, [runSimulationStep]);

  const stopSimulation = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setState(prev => ({
      ...prev,
      isRunning: false,
      logs: [...prev.logs, '🏁 Simulation complete!'],
    }));
    toast.success('Simulation Complete', {
      description: 'Demo finished - data has been updated',
    });
  }, []);

  return {
    state,
    startSimulation,
    stopSimulation,
  };
}
