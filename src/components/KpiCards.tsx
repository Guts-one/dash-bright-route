import { FleetStats } from '@/lib/types';
import { Truck, MapPin, Square, WifiOff, AlertTriangle, Package, CheckCircle, Navigation } from 'lucide-react';

interface KpiCardsProps {
  stats: FleetStats;
}

export function KpiCards({ stats }: KpiCardsProps) {
  const cards = [
    {
      label: 'Frota total',
      value: stats.totalTrucks,
      icon: Truck,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Em rota',
      value: stats.enRoute,
      icon: Navigation,
      color: 'text-status-en-route',
      bg: 'bg-status-en-route/10',
    },
    {
      label: 'No cliente',
      value: stats.atCustomer,
      icon: MapPin,
      color: 'text-status-at-customer',
      bg: 'bg-status-at-customer/10',
    },
    {
      label: 'Parado',
      value: stats.stopped,
      icon: Square,
      color: 'text-status-stopped',
      bg: 'bg-status-stopped/10',
    },
    {
      label: 'Offline',
      value: stats.offline,
      icon: WifiOff,
      color: 'text-status-offline',
      bg: 'bg-status-offline/10',
    },
    {
      label: 'Alertas de manutencao',
      value: stats.maintenanceAlerts,
      icon: AlertTriangle,
      color: stats.maintenanceAlerts > 0 ? 'text-alert-warning' : 'text-muted-foreground',
      bg: stats.maintenanceAlerts > 0 ? 'bg-alert-warning/10' : 'bg-muted',
    },
    {
      label: 'Entregas pendentes',
      value: stats.pendingDeliveries,
      icon: Package,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'Concluidas hoje',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-status-at-customer',
      bg: 'bg-status-at-customer/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card) => (
        <div key={card.label} className="kpi-card">
          <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center mb-2`}>
            <card.icon className={`w-4 h-4 ${card.color}`} />
          </div>
          <p className="kpi-value">{card.value}</p>
          <p className="kpi-label">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
