import React from 'react';

export interface ProductionCardProps {
  title: string;
  productName: string;
  currentQuantity: number;
  targetQuantity: number;
  status: 'running' | 'stopped' | 'maintenance' | 'completed';
  progress?: number;
  startTime?: string;
  estimatedCompletion?: string;
  className?: string;
  onViewDetails?: () => void;
}

export const ProductionCard: React.FC<ProductionCardProps> = ({
  title,
  productName,
  currentQuantity,
  targetQuantity,
  status,
  progress,
  startTime,
  estimatedCompletion,
  className = '',
  onViewDetails
}) => {
  const statusConfig = {
    running: { 
      color: 'badge-success', 
      label: 'Running',
      bgColor: 'bg-success/10'
    },
    stopped: { 
      color: 'badge-error', 
      label: 'Stopped',
      bgColor: 'bg-error/10'
    },
    maintenance: { 
      color: 'badge-warning', 
      label: 'Maintenance',
      bgColor: 'bg-warning/10'
    },
    completed: { 
      color: 'badge-info', 
      label: 'Completed',
      bgColor: 'bg-info/10'
    }
  };

  const progressPercent = progress ?? Math.round((currentQuantity / targetQuantity) * 100);
  const config = statusConfig[status];

  return (
    <div className={`card bg-base-100 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="card-body">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="card-title text-lg">{title}</h3>
            <p className="text-base-content/70">{productName}</p>
          </div>
          <span className={`badge ${config.color}`}>{config.label}</span>
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-base-content/70">Progress</span>
            <span className="text-sm font-medium">{progressPercent}%</span>
          </div>
          
          <progress 
            className="progress progress-primary w-full" 
            value={progressPercent} 
            max="100"
          ></progress>
          
          <div className="flex justify-between text-sm">
            <span className="text-base-content/70">Current</span>
            <span className="font-medium">{currentQuantity.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between text-sm">
            <span className="text-base-content/70">Target</span>
            <span className="font-medium">{targetQuantity.toLocaleString()}</span>
          </div>
          
          {startTime && (
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">Started</span>
              <span className="font-medium">{startTime}</span>
            </div>
          )}
          
          {estimatedCompletion && (
            <div className="flex justify-between text-sm">
              <span className="text-base-content/70">Est. Completion</span>
              <span className="font-medium">{estimatedCompletion}</span>
            </div>
          )}
        </div>
        
        {onViewDetails && (
          <div className="card-actions justify-end mt-4">
            <button onClick={onViewDetails} className="btn btn-primary btn-sm">
              View Details
            </button>
          </div>
        )}
      </div>
    </div>
  );
};