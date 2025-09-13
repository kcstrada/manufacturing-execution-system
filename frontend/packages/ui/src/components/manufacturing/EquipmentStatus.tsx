import React from 'react';

export interface EquipmentStatusProps {
  equipmentId: string;
  equipmentName: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  location?: string;
  lastUpdate?: string;
  metrics?: {
    label: string;
    value: string | number;
    unit?: string;
  }[];
  className?: string;
  onStatusClick?: () => void;
}

export const EquipmentStatus: React.FC<EquipmentStatusProps> = ({
  equipmentId,
  equipmentName,
  status,
  location,
  lastUpdate,
  metrics = [],
  className = '',
  onStatusClick
}) => {
  const statusConfig = {
    online: {
      color: 'bg-success',
      label: 'Online',
      textColor: 'text-success',
      badgeColor: 'badge-success'
    },
    offline: {
      color: 'bg-base-300',
      label: 'Offline',
      textColor: 'text-base-content/50',
      badgeColor: 'badge-ghost'
    },
    maintenance: {
      color: 'bg-warning',
      label: 'Maintenance',
      textColor: 'text-warning',
      badgeColor: 'badge-warning'
    },
    error: {
      color: 'bg-error',
      label: 'Error',
      textColor: 'text-error',
      badgeColor: 'badge-error'
    }
  };

  const config = statusConfig[status];

  return (
    <div className={`card bg-base-100 shadow-sm border border-base-200 ${className}`}>
      <div className="card-body p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div 
              className={`w-3 h-3 rounded-full ${config.color} ${status === 'online' ? 'animate-pulse' : ''}`}
            />
            <div>
              <h3 className="font-medium text-base">{equipmentName}</h3>
              <p className="text-sm text-base-content/70">ID: {equipmentId}</p>
              {location && (
                <p className="text-xs text-base-content/50">{location}</p>
              )}
            </div>
          </div>
          <button
            onClick={onStatusClick}
            className={`badge ${config.badgeColor} cursor-pointer hover:opacity-80`}
          >
            {config.label}
          </button>
        </div>
        
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {metrics.map((metric, index) => (
              <div key={index} className="text-center p-2 bg-base-200/50 rounded">
                <div className="text-lg font-semibold">
                  {metric.value}
                  {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                </div>
                <div className="text-xs text-base-content/70">{metric.label}</div>
              </div>
            ))}
          </div>
        )}
        
        {lastUpdate && (
          <div className="text-xs text-base-content/50 text-right">
            Last update: {lastUpdate}
          </div>
        )}
      </div>
    </div>
  );
};