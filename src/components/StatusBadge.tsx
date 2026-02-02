import { cn } from '@/lib/utils';
import { TruckStatus, DeliveryStatus, AlertSeverity } from '@/lib/types';
import { Truck, MapPin, Square, WifiOff, Clock, Package, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface StatusBadgeProps {
  status: TruckStatus | DeliveryStatus | AlertSeverity;
  type?: 'truck' | 'delivery' | 'alert';
  showIcon?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ 
  status, 
  type = 'truck', 
  showIcon = true, 
  size = 'md',
  className 
}: StatusBadgeProps) {
  const getStatusConfig = () => {
    if (type === 'truck') {
      switch (status as TruckStatus) {
        case 'en_route':
          return { 
            label: 'Em rota', 
            icon: Truck, 
            class: 'status-en-route' 
          };
        case 'stopped':
          return { 
            label: 'Parado', 
            icon: Square, 
            class: 'status-stopped' 
          };
        case 'at_customer':
          return { 
            label: 'No cliente', 
            icon: MapPin, 
            class: 'status-at-customer' 
          };
        case 'offline':
          return { 
            label: 'Offline', 
            icon: WifiOff, 
            class: 'status-offline' 
          };
      }
    }

    if (type === 'delivery') {
      switch (status as DeliveryStatus) {
        case 'pending':
          return { 
            label: 'Pendente', 
            icon: Clock, 
            class: 'bg-muted text-muted-foreground' 
          };
        case 'in_progress':
          return { 
            label: 'Em andamento', 
            icon: Package, 
            class: 'status-en-route' 
          };
        case 'completed':
          return { 
            label: 'Concluida', 
            icon: CheckCircle, 
            class: 'status-at-customer' 
          };
        case 'failed':
          return { 
            label: 'Problema', 
            icon: XCircle, 
            class: 'alert-badge-danger' 
          };
      }
    }

    if (type === 'alert') {
      switch (status as AlertSeverity) {
        case 'due_soon':
          return { 
            label: 'Vence em breve', 
            icon: Clock, 
            class: 'alert-badge-warning' 
          };
        case 'overdue':
          return { 
            label: 'Atrasado', 
            icon: AlertTriangle, 
            class: 'alert-badge-danger' 
          };
      }
    }

    return { label: status, icon: Clock, class: 'bg-muted text-muted-foreground' };
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <span 
      className={cn(
        'status-badge',
        config.class,
        size === 'sm' && 'text-xs px-2 py-0.5',
        className
      )}
    >
      {showIcon && <Icon className={cn('shrink-0', size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5')} />}
      {config.label}
    </span>
  );
}
