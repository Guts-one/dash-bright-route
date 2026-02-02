import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/StatusBadge';
import { FleetMap } from '@/components/FleetMap';
import { useTrucks, useCustomers, useTruckRoute, useGpsEvents, useDeliveries } from '@/hooks/useFleetData';
import { formatIssueCategory, formatRelativeTime } from '@/lib/fleet-utils';
import { 
  ArrowLeft, Truck, Gauge, Fuel, Calendar, MapPin, 
  Package, Clock, AlertTriangle, Navigation, User
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TruckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const { data: trucks, isLoading: trucksLoading } = useTrucks();
  const { data: customers } = useCustomers();
  const { data: route } = useTruckRoute(id || '');
  const { data: gpsEvents } = useGpsEvents(id || '', 50);
  const { data: deliveries } = useDeliveries({ truckId: id, today: true });

  const truck = trucks?.find(t => t.id === id);

  if (trucksLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[500px]" />
          <div className="space-y-6">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Truck className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Caminhao nao encontrado</h2>
          <Button asChild>
            <Link to={role === 'manager' ? '/dashboard' : '/driver'}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao painel
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Route customers for the map
  const routeCustomerIds = route?.planned_path?.map(p => p.customer_id).filter(Boolean) as string[] || [];
  const routeCustomers = customers?.filter(c => routeCustomerIds.includes(c.id)) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-lg">{truck.name}</h1>
              <StatusBadge status={truck.status || 'offline'} type="truck" />
            </div>
            <p className="text-sm text-muted-foreground">{truck.plate}</p>
          </div>
          {truck.driver_name && (
            <div className="flex items-center gap-2 text-sm">
              <User className="w-4 h-4 text-muted-foreground" />
              {truck.driver_name}
            </div>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column - Map and Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Gauge className="w-4 h-4" />
                    <span className="text-xs">Hodometro</span>
                  </div>
                  <p className="text-xl font-bold">{truck.odometer_km.toLocaleString()} km</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Fuel className="w-4 h-4" />
                    <span className="text-xs">Combustivel usado</span>
                  </div>
                  <p className="text-xl font-bold">{truck.fuel_used_l.toLocaleString()} L</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Navigation className="w-4 h-4" />
                    <span className="text-xs">Velocidade</span>
                  </div>
                  <p className="text-xl font-bold">{Math.round(truck.last_speed || 0)} km/h</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs">Ultima atualizacao</span>
                  </div>
                  <p className="text-xl font-bold">
                    {truck.last_update_ts ? formatRelativeTime(truck.last_update_ts) : '—'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Map with route */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Rota e localizacao
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FleetMap
                  trucks={[truck]}
                  customers={routeCustomers}
                  gpsHistory={gpsEvents}
                  plannedPath={route?.planned_path}
                  showCustomers={true}
                  className="h-[400px]"
                />
                <div className="flex items-center gap-6 mt-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-[#0d9488]" /> Rota real
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-0.5 bg-[#3b82f6] border-dashed" style={{ borderStyle: 'dashed', borderWidth: '1px 0' }} /> Rota planejada
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* GPS Timeline */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Linha do tempo do GPS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] fleet-scrollbar">
                  <div className="space-y-1">
                    {gpsEvents && gpsEvents.length > 0 ? (
                      gpsEvents.slice(0, 20).map((event, index) => (
                        <div key={event.id} className="timeline-item">
                          <div className="timeline-dot" />
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {event.lat.toFixed(4)}, {event.lng.toFixed(4)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {Math.round(event.speed)} km/h
                              </p>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatRelativeTime(event.ts)}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhum evento de GPS registrado
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Deliveries */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Entregas de hoje
                  {deliveries && (
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {deliveries.filter(d => d.status === 'completed').length}/{deliveries.length}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] fleet-scrollbar">
                  <div className="space-y-3">
                    {deliveries && deliveries.length > 0 ? (
                      deliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className={`p-3 rounded-lg border ${
                            delivery.status === 'completed'
                              ? 'bg-status-at-customer/5 border-status-at-customer/20'
                              : delivery.status === 'failed'
                              ? 'bg-destructive/5 border-destructive/20'
                              : 'bg-muted/50'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium text-sm">
                                {delivery.customer?.name || 'Desconhecido'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Parada #{delivery.stop_order}
                              </p>
                            </div>
                            <StatusBadge status={delivery.status} type="delivery" size="sm" />
                          </div>
                          
                          {delivery.signature_url && (
                            <div className="mt-2 p-2 bg-background rounded border">
                              <p className="text-xs text-muted-foreground mb-1">Assinatura:</p>
                              <img 
                                src={delivery.signature_url} 
                                alt="Signature" 
                                className="h-12 object-contain"
                              />
                            </div>
                          )}
                          
                          {delivery.issue_category && (
                            <div className="mt-2 flex items-center gap-1 text-xs text-destructive">
                              <AlertTriangle className="w-3 h-3" />
                              {formatIssueCategory(delivery.issue_category)}
                              {delivery.issue_notes && (
                                <span className="text-muted-foreground ml-1">
                                  - {delivery.issue_notes}
                                </span>
                              )}
                            </div>
                          )}
                          
                          {delivery.completed_ts && (
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatRelativeTime(delivery.completed_ts)}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Nenhuma entrega programada
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
