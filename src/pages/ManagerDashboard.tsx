import { useAuth } from '@/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FleetMap } from '@/components/FleetMap';
import { FleetTable } from '@/components/FleetTable';
import { KpiCards } from '@/components/KpiCards';
import { MaintenanceAlertsList } from '@/components/MaintenanceAlertsList';
import { LiveDeliveryFeed } from '@/components/LiveDeliveryFeed';
import { 
  useTrucks, 
  useCustomers, 
  useFleetStats, 
  useMaintenanceAlerts,
  useRouteDeviations,
  useDeliveries,
  useFleetRealtime 
} from '@/hooks/useFleetData';
import { useDemoSimulation } from '@/hooks/useDemoSimulation';
import { 
  Truck, LogOut, Play, Pause, MapPin, AlertTriangle, 
  Zap, Package, RefreshCw, Settings, Eye 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';

export default function ManagerDashboard() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [selectedTruckId, setSelectedTruckId] = useState<string>();

  // Enable real-time updates
  useFleetRealtime();

  // Data hooks
  const { data: trucks, isLoading: trucksLoading } = useTrucks();
  const { data: customers } = useCustomers();
  const { data: stats, isLoading: statsLoading } = useFleetStats();
  const { data: maintenanceAlerts } = useMaintenanceAlerts(false);
  const { data: deviations } = useRouteDeviations(true);
  const { data: deliveries } = useDeliveries({ today: true });

  // Demo simulation
  const { state: simState, startSimulation, stopSimulation } = useDemoSimulation();

  const deviatingTruckIds = deviations?.map(d => d.truck_id) || [];
  const maintenanceAlertTruckIds = [...new Set(maintenanceAlerts?.map(a => a.truck_id) || [])];

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold">FleetTrack Pro</h1>
              <p className="text-xs text-muted-foreground">Painel do gerente</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Demo controls */}
            <div className="flex items-center gap-2 mr-4">
              {!simState.isRunning ? (
                <Button onClick={startSimulation} size="sm" className="gap-2">
                  <Play className="w-4 h-4" />
                  Iniciar simulacao demo
                </Button>
              ) : (
                <Button onClick={stopSimulation} variant="secondary" size="sm" className="gap-2">
                  <Pause className="w-4 h-4" />
                  Parar ({simState.currentStep + 1}/{simState.totalSteps})
                </Button>
              )}
            </div>

            <Button variant="ghost" size="sm" asChild>
              <Link to="/transparency" className="gap-2">
                <Eye className="w-4 h-4" />
                Transparencia
              </Link>
            </Button>

            <div className="flex items-center gap-2 pl-4 border-l">
              <span className="text-sm text-muted-foreground">{profile?.name}</span>
              <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <section>
          {statsLoading || !stats ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : (
            <KpiCards stats={stats} />
          )}
        </section>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map + Table (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Map */}
            <div className="fleet-card p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                Mapa da frota
                {simState.isRunning && (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-accent">
                    <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    Ao vivo
                  </span>
                )}
              </h2>
              {trucksLoading ? (
                <Skeleton className="h-[400px] rounded-lg" />
              ) : (
                <FleetMap
                  trucks={trucks || []}
                  customers={customers || []}
                  selectedTruckId={selectedTruckId}
                  onTruckClick={(truck) => setSelectedTruckId(truck.id)}
                  className="h-[400px]"
                />
              )}
            </div>

            {/* Fleet Table */}
            <div>
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-primary" />
                Visao geral da frota
              </h2>
              {trucksLoading ? (
                <Skeleton className="h-[300px]" />
              ) : (
                <FleetTable
                  trucks={trucks || []}
                  deviatingTruckIds={deviatingTruckIds}
                  maintenanceAlertTruckIds={maintenanceAlertTruckIds}
                  onTruckSelect={(truck) => setSelectedTruckId(truck.id)}
                />
              )}
            </div>
          </div>

          {/* Right sidebar (1/3 width) */}
          <div className="space-y-6">
            {/* Simulation Log (only when running) */}
            {simState.logs.length > 0 && (
              <div className="fleet-card p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  Registro da simulacao
                </h3>
                <ScrollArea className="h-32 fleet-scrollbar">
                  <div className="space-y-1 text-xs font-mono">
                    {simState.logs.map((log, i) => (
                      <p key={i} className="text-muted-foreground">{log}</p>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Maintenance Alerts */}
            <div className="fleet-card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-alert-warning" />
                Alertas de manutencao
                {maintenanceAlerts && maintenanceAlerts.length > 0 && (
                  <span className="ml-auto px-2 py-0.5 bg-alert-warning/10 text-alert-warning rounded-full text-xs">
                    {maintenanceAlerts.length}
                  </span>
                )}
              </h3>
              <MaintenanceAlertsList alerts={maintenanceAlerts || []} maxHeight="250px" />
            </div>

            {/* Live Delivery Feed */}
            <div className="fleet-card p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-status-at-customer" />
                Feed de entregas ao vivo
              </h3>
              <LiveDeliveryFeed deliveries={deliveries || []} maxHeight="300px" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
