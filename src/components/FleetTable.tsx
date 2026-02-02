import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from './StatusBadge';
import { Truck, TruckStatus } from '@/lib/types';
import { formatRelativeTime } from '@/lib/fleet-utils';
import { Search, AlertTriangle, ChevronRight, Gauge, Fuel } from 'lucide-react';

interface FleetTableProps {
  trucks: Truck[];
  deviatingTruckIds?: string[];
  maintenanceAlertTruckIds?: string[];
  onTruckSelect?: (truck: Truck) => void;
}

export function FleetTable({ 
  trucks, 
  deviatingTruckIds = [], 
  maintenanceAlertTruckIds = [],
  onTruckSelect 
}: FleetTableProps) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showLateOnly, setShowLateOnly] = useState(false);
  const [showDeviationsOnly, setShowDeviationsOnly] = useState(false);
  const [showMaintenanceOnly, setShowMaintenanceOnly] = useState(false);

  const filteredTrucks = useMemo(() => {
    let result = trucks;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        t => 
          t.name.toLowerCase().includes(searchLower) ||
          t.plate.toLowerCase().includes(searchLower) ||
          t.driver_name?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(t => t.status === statusFilter);
    }

    // Late updates filter (>5 min)
    if (showLateOnly) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      result = result.filter(t => {
        if (!t.last_update_ts) return true;
        return new Date(t.last_update_ts) < fiveMinutesAgo;
      });
    }

    // Deviations filter
    if (showDeviationsOnly) {
      result = result.filter(t => deviatingTruckIds.includes(t.id));
    }

    // Maintenance filter
    if (showMaintenanceOnly) {
      result = result.filter(t => maintenanceAlertTruckIds.includes(t.id));
    }

    return result;
  }, [trucks, search, statusFilter, showLateOnly, showDeviationsOnly, showMaintenanceOnly, deviatingTruckIds, maintenanceAlertTruckIds]);

  const handleRowClick = (truck: Truck) => {
    if (onTruckSelect) {
      onTruckSelect(truck);
    }
    navigate(`/truck/${truck.id}`);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar caminhoes, placas, motoristas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="en_route">Em rota</SelectItem>
            <SelectItem value="stopped">Parado</SelectItem>
            <SelectItem value="at_customer">No cliente</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant={showLateOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowLateOnly(!showLateOnly)}
          className="gap-1.5"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Atualizacoes atrasadas
        </Button>

        <Button
          variant={showDeviationsOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowDeviationsOnly(!showDeviationsOnly)}
          disabled={deviatingTruckIds.length === 0}
          className="gap-1.5"
        >
          Desvios de rota
          {deviatingTruckIds.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-destructive text-destructive-foreground rounded-full text-xs">
              {deviatingTruckIds.length}
            </span>
          )}
        </Button>

        <Button
          variant={showMaintenanceOnly ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowMaintenanceOnly(!showMaintenanceOnly)}
          disabled={maintenanceAlertTruckIds.length === 0}
          className="gap-1.5"
        >
          Manutencao
          {maintenanceAlertTruckIds.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-alert-warning text-primary-foreground rounded-full text-xs">
              {maintenanceAlertTruckIds.length}
            </span>
          )}
        </Button>
      </div>

      {/* Table */}
      <div className="fleet-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">Caminhao</TableHead>
              <TableHead className="w-[100px]">Placa</TableHead>
              <TableHead>Motorista</TableHead>
              <TableHead className="w-[120px]">Status</TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5" />
                  Quilometragem
                </div>
              </TableHead>
              <TableHead className="w-[100px]">
                <div className="flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5" />
                  Combustivel
                </div>
              </TableHead>
              <TableHead className="w-[100px]">Ultima atualizacao</TableHead>
              <TableHead className="w-[60px]">Alertas</TableHead>
              <TableHead className="w-[40px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTrucks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  Nenhum caminhao corresponde aos filtros
                </TableCell>
              </TableRow>
            ) : (
              filteredTrucks.map((truck) => {
                const hasDeviation = deviatingTruckIds.includes(truck.id);
                const hasMaintenance = maintenanceAlertTruckIds.includes(truck.id);
                const isLate = truck.last_update_ts && 
                  new Date(truck.last_update_ts) < new Date(Date.now() - 5 * 60 * 1000);

                return (
                  <TableRow 
                    key={truck.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(truck)}
                  >
                    <TableCell className="font-medium">{truck.name}</TableCell>
                    <TableCell className="font-mono text-sm">{truck.plate}</TableCell>
                    <TableCell>{truck.driver_name || '—'}</TableCell>
                    <TableCell>
                      <StatusBadge status={truck.status || 'offline'} type="truck" size="sm" />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {truck.odometer_km.toLocaleString()} km
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {truck.fuel_used_l.toLocaleString()} L
                    </TableCell>
                    <TableCell className={isLate ? 'text-alert-warning font-medium' : ''}>
                      {truck.last_update_ts ? formatRelativeTime(truck.last_update_ts) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {hasDeviation && (
                          <span className="w-2 h-2 rounded-full bg-destructive" title="Desvio de rota" />
                        )}
                        {hasMaintenance && (
                          <span className="w-2 h-2 rounded-full bg-alert-warning" title="Manutencao pendente" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
