import { MaintenanceAlert } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from '@/lib/fleet-utils';
import { Wrench, Gauge, Calendar, AlertTriangle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MaintenanceAlertsListProps {
  alerts: MaintenanceAlert[];
  maxHeight?: string;
}

const typeIcons: Record<string, string> = {
  oil: '🛢️',
  tires: '🛞',
  inspection: '🔍',
  brakes: '🛑',
  filters: '🌬️',
  transmission: '⚙️',
};

export function MaintenanceAlertsList({ alerts, maxHeight = '300px' }: MaintenanceAlertsListProps) {
  if (alerts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Wrench className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No maintenance alerts</p>
      </div>
    );
  }

  // Sort by severity (overdue first) and then by date
  const sortedAlerts = [...alerts].sort((a, b) => {
    if (a.severity === 'overdue' && b.severity !== 'overdue') return -1;
    if (a.severity !== 'overdue' && b.severity === 'overdue') return 1;
    return new Date(b.created_ts).getTime() - new Date(a.created_ts).getTime();
  });

  return (
    <ScrollArea style={{ maxHeight }} className="fleet-scrollbar">
      <div className="space-y-3 pr-4">
        {sortedAlerts.map((alert) => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border transition-all ${
              alert.severity === 'overdue'
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-alert-warning/30 bg-alert-warning/5'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-lg" role="img" aria-label={alert.rule?.type}>
                  {typeIcons[alert.rule?.type || 'inspection']}
                </span>
                <div>
                  <p className="font-medium text-sm">
                    {alert.truck?.name || 'Unknown Truck'}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {alert.rule?.type} Service
                  </p>
                </div>
              </div>
              <StatusBadge status={alert.severity} type="alert" size="sm" showIcon={false} />
            </div>

            <p className="text-sm mt-2 text-foreground/80">{alert.message}</p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatRelativeTime(alert.created_ts)}
              </span>
              {alert.rule && (
                <span className="flex items-center gap-1">
                  <Gauge className="w-3 h-3" />
                  Every {alert.rule.interval_km.toLocaleString()} km
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
