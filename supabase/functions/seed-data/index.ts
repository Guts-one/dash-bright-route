import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// San Francisco area coordinates
const SF_CENTER = { lat: 37.7749, lng: -122.4194 };

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    console.log('Starting seed data generation...');

    // Create demo users
    const users = [
      { email: 'manager@demo.com', password: 'demo1234', name: 'Alex Manager', role: 'manager' },
      { email: 'driver1@demo.com', password: 'demo1234', name: 'John Driver', role: 'driver' },
      { email: 'driver2@demo.com', password: 'demo1234', name: 'Sarah Roads', role: 'driver' },
      { email: 'driver3@demo.com', password: 'demo1234', name: 'Mike Wheels', role: 'driver' },
      { email: 'driver4@demo.com', password: 'demo1234', name: 'Emma Haul', role: 'driver' },
      { email: 'driver5@demo.com', password: 'demo1234', name: 'Carlos Fleet', role: 'driver' },
    ];

    const createdUserIds: Record<string, string> = {};

    for (const u of users) {
      const { data: existingUser } = await supabase.auth.admin.listUsers();
      const existing = existingUser?.users?.find(eu => eu.email === u.email);
      
      if (existing) {
        createdUserIds[u.email] = existing.id;
        console.log(`User ${u.email} already exists`);
      } else {
        const { data, error } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.name }
        });
        if (error) {
          console.log(`Error creating ${u.email}:`, error.message);
        } else if (data.user) {
          createdUserIds[u.email] = data.user.id;
          await supabase.from('user_roles').upsert({ 
            user_id: data.user.id, 
            role: u.role 
          }, { onConflict: 'user_id,role' });
          console.log(`Created user ${u.email}`);
        }
      }
    }

    // Create 20 customers around SF
    const customerNames = [
      'Bay Area Foods', 'SF Warehouse Co', 'Oakland Distribution', 'Berkeley Supply',
      'Palo Alto Tech', 'San Jose Logistics', 'Fremont Industrial', 'Hayward Goods',
      'Richmond Port', 'Walnut Creek Store', 'Concord Depot', 'Pleasanton Hub',
      'Livermore Center', 'Dublin Market', 'San Mateo Shop', 'Redwood City Co',
      'Menlo Park Inc', 'Sunnyvale Ltd', 'Mountain View Corp', 'Santa Clara Biz'
    ];

    const customers: any[] = [];
    for (let i = 0; i < 20; i++) {
      const lat = SF_CENTER.lat + (Math.random() - 0.5) * 0.3;
      const lng = SF_CENTER.lng + (Math.random() - 0.5) * 0.4;
      customers.push({
        name: customerNames[i],
        address: `${1000 + i * 50} Market St, San Francisco, CA`,
        lat, lng,
        geofence_radius_m: 100 + Math.floor(Math.random() * 100)
      });
    }

    const { data: insertedCustomers, error: custErr } = await supabase
      .from('customers')
      .upsert(customers, { onConflict: 'id' })
      .select();
    
    if (custErr) console.log('Customer error:', custErr.message);
    console.log(`Created ${insertedCustomers?.length || 0} customers`);

    // Create 25 trucks
    const driverEmails = ['driver1@demo.com', 'driver2@demo.com', 'driver3@demo.com', 'driver4@demo.com', 'driver5@demo.com'];
    const trucks: any[] = [];
    
    for (let i = 1; i <= 25; i++) {
      const driverEmail = driverEmails[(i - 1) % 5];
      const driverId = createdUserIds[driverEmail];
      const lat = SF_CENTER.lat + (Math.random() - 0.5) * 0.2;
      const lng = SF_CENTER.lng + (Math.random() - 0.5) * 0.3;
      
      trucks.push({
        plate: `TRK-${String(i).padStart(3, '0')}`,
        name: `Truck ${i}`,
        driver_id: driverId,
        last_lat: lat,
        last_lng: lng,
        last_update_ts: new Date(Date.now() - Math.random() * 300000).toISOString(),
        last_speed: 20 + Math.random() * 50,
        odometer_km: 50000 + Math.random() * 100000,
        fuel_used_l: 5000 + Math.random() * 15000
      });
    }

    const { data: insertedTrucks, error: truckErr } = await supabase
      .from('trucks')
      .upsert(trucks, { onConflict: 'plate' })
      .select();
    
    if (truckErr) console.log('Truck error:', truckErr.message);
    console.log(`Created ${insertedTrucks?.length || 0} trucks`);

    const truckIds = insertedTrucks?.map(t => t.id) || [];
    const customerIds = insertedCustomers?.map(c => c.id) || [];

    // Create routes for today (8 trucks)
    const today = new Date().toISOString().split('T')[0];
    const routes: any[] = [];
    
    for (let i = 0; i < 8 && i < truckIds.length; i++) {
      const stops = 5 + Math.floor(Math.random() * 4);
      const path: any[] = [];
      
      for (let j = 0; j < stops; j++) {
        const custIdx = (i * stops + j) % customerIds.length;
        const cust = insertedCustomers?.[custIdx];
        if (cust) {
          path.push({ lat: cust.lat, lng: cust.lng, order: j + 1, customer_id: cust.id });
        }
      }
      
      routes.push({
        truck_id: truckIds[i],
        date: today,
        planned_path: path
      });
    }

    const { data: insertedRoutes, error: routeErr } = await supabase
      .from('routes')
      .upsert(routes, { onConflict: 'truck_id,date' })
      .select();
    
    if (routeErr) console.log('Route error:', routeErr.message);
    console.log(`Created ${insertedRoutes?.length || 0} routes`);

    // Create GPS events for each truck
    const gpsEvents: any[] = [];
    for (const truck of insertedTrucks || []) {
      for (let j = 0; j < 30; j++) {
        const ts = new Date(Date.now() - j * 120000); // Every 2 min going back
        gpsEvents.push({
          truck_id: truck.id,
          ts: ts.toISOString(),
          lat: truck.last_lat + (Math.random() - 0.5) * 0.01,
          lng: truck.last_lng + (Math.random() - 0.5) * 0.01,
          speed: 10 + Math.random() * 60
        });
      }
    }

    const { error: gpsErr } = await supabase.from('gps_events').insert(gpsEvents);
    if (gpsErr) console.log('GPS error:', gpsErr.message);
    console.log(`Created ${gpsEvents.length} GPS events`);

    // Create deliveries for routes
    const deliveries: any[] = [];
    for (const route of insertedRoutes || []) {
      const truck = insertedTrucks?.find(t => t.id === route.truck_id);
      const path = route.planned_path as any[];
      
      for (let i = 0; i < path.length; i++) {
        const status = i < 2 ? 'completed' : i < 4 ? 'pending' : 'pending';
        deliveries.push({
          route_id: route.id,
          customer_id: path[i].customer_id,
          truck_id: route.truck_id,
          driver_id: truck?.driver_id,
          status,
          stop_order: i + 1,
          completed_ts: status === 'completed' ? new Date().toISOString() : null,
          signature_url: status === 'completed' ? `https://picsum.photos/seed/${i}/300/100` : null,
          issue_category: i === 1 ? 'refused' : null,
          issue_notes: i === 1 ? 'Customer not available' : null
        });
      }
    }

    const { error: delErr } = await supabase.from('deliveries').insert(deliveries);
    if (delErr) console.log('Delivery error:', delErr.message);
    console.log(`Created ${deliveries.length} deliveries`);

    // Create maintenance rules and alerts
    const maintenanceTypes = ['oil', 'tires', 'inspection', 'brakes', 'filters', 'transmission'];
    const rules: any[] = [];
    const alerts: any[] = [];
    
    for (let i = 0; i < Math.min(6, truckIds.length); i++) {
      const rule = {
        truck_id: truckIds[i],
        type: maintenanceTypes[i],
        interval_km: 10000 + i * 5000,
        interval_days: 90 + i * 30,
        last_service_km: (insertedTrucks?.[i]?.odometer_km || 50000) - 9000 - Math.random() * 2000,
        last_service_date: new Date(Date.now() - 80 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      rules.push(rule);
    }

    const { data: insertedRules, error: ruleErr } = await supabase
      .from('maintenance_rules')
      .insert(rules)
      .select();
    
    if (ruleErr) console.log('Rule error:', ruleErr.message);

    // Create some alerts
    for (let i = 0; i < Math.min(3, insertedRules?.length || 0); i++) {
      const rule = insertedRules?.[i];
      alerts.push({
        truck_id: rule.truck_id,
        rule_id: rule.id,
        severity: i === 0 ? 'overdue' : 'due_soon',
        message: `${rule.type} service ${i === 0 ? 'overdue' : 'due soon'} for Truck ${i + 1}`
      });
    }

    const { error: alertErr } = await supabase.from('maintenance_alerts').insert(alerts);
    if (alertErr) console.log('Alert error:', alertErr.message);
    console.log(`Created ${alerts.length} maintenance alerts`);

    return new Response(
      JSON.stringify({ success: true, message: 'Seed data created successfully!' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Seed error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
