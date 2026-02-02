import { Delivery } from '@/lib/types';
import { StatusBadge } from './StatusBadge';
import { formatIssueCategory, formatRelativeTime } from '@/lib/fleet-utils';
import { Package, FileSignature, AlertCircle, Truck } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LiveDeliveryFeedProps {
  deliveries: Delivery[];
  maxHeight?: string;
}

export function LiveDeliveryFeed({ deliveries, maxHeight = '300px' }: LiveDeliveryFeedProps) {
  // Show most recent first, completed and failed only
  const feedDeliveries = deliveries
    .filter(d => d.status === 'completed' || d.status === 'failed')
    .sort((a, b) => {
      const dateA = a.completed_ts ? new Date(a.completed_ts) : new Date(a.created_at);
      const dateB = b.completed_ts ? new Date(b.completed_ts) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 20);

  if (feedDeliveries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Nenhuma entrega recente</p>
      </div>
    );
  }

  return (
    <ScrollArea style={{ maxHeight }} className="fleet-scrollbar">
      <div className="space-y-3 pr-4">
        {feedDeliveries.map((delivery) => (
          <div
            key={delivery.id}
            className={`p-3 rounded-lg border transition-all animate-slide-up ${
              delivery.status === 'failed'
                ? 'border-destructive/30 bg-destructive/5'
                : 'border-status-at-customer/30 bg-status-at-customer/5'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {delivery.customer?.name || 'Cliente desconhecido'}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <Truck className="w-3 h-3" />
                  <span>{delivery.truck?.name || 'Desconhecido'}</span>
                </div>
              </div>
              <StatusBadge status={delivery.status} type="delivery" size="sm" />
            </div>

            <div className="flex items-center gap-3 mt-2">
              {/* Badges for signature and issues */}
              {delivery.signature_url && (
                <span className="inline-flex items-center gap-1 text-xs text-status-at-customer bg-status-at-customer/10 px-2 py-0.5 rounded-full">
                  <FileSignature className="w-3 h-3" />
                  Assinado
                </span>
              )}
              {delivery.issue_category && (
                <span className="inline-flex items-center gap-1 text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  {formatIssueCategory(delivery.issue_category)}
                </span>
              )}
            </div>

            {delivery.issue_notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">
                "{delivery.issue_notes}"
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {delivery.completed_ts
                ? formatRelativeTime(delivery.completed_ts)
                : formatRelativeTime(delivery.created_at)}
            </p>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
