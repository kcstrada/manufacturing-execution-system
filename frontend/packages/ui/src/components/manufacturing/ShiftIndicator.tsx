import React from 'react';

export interface ShiftInfo {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  supervisor?: string;
  workers?: number;
}

export interface ShiftIndicatorProps {
  currentShift: ShiftInfo;
  nextShift?: ShiftInfo;
  timeRemaining?: string;
  className?: string;
  variant?: 'compact' | 'detailed';
  showNextShift?: boolean;
}

export const ShiftIndicator: React.FC<ShiftIndicatorProps> = ({
  currentShift,
  nextShift,
  timeRemaining,
  className = '',
  variant = 'detailed',
  showNextShift = true
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={`card bg-base-100 shadow-sm ${className}`}>
      <div className={`card-body ${isCompact ? 'p-3' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse" />
            <div>
              <h3 className={`font-semibold ${isCompact ? 'text-sm' : 'text-base'}`}>
                {currentShift.name}
              </h3>
              {!isCompact && (
                <p className="text-xs text-base-content/70">
                  {currentShift.startTime} - {currentShift.endTime}
                </p>
              )}
            </div>
          </div>
          <div className="badge badge-primary badge-sm">Active</div>
        </div>
        
        {!isCompact && (
          <div className="mt-2 space-y-1">
            {currentShift.supervisor && (
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Supervisor</span>
                <span className="font-medium">{currentShift.supervisor}</span>
              </div>
            )}
            {currentShift.workers && (
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Workers</span>
                <span className="font-medium">{currentShift.workers}</span>
              </div>
            )}
            {timeRemaining && (
              <div className="flex justify-between text-sm">
                <span className="text-base-content/70">Time Remaining</span>
                <span className="font-medium text-warning">{timeRemaining}</span>
              </div>
            )}
          </div>
        )}
        
        {showNextShift && nextShift && (
          <div className={`${isCompact ? 'mt-2' : 'mt-4'} pt-2 border-t border-base-200`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`font-medium ${isCompact ? 'text-xs' : 'text-sm'} text-base-content/70`}>
                  Next: {nextShift.name}
                </h4>
                <p className="text-xs text-base-content/50">
                  {nextShift.startTime} - {nextShift.endTime}
                </p>
              </div>
              {!isCompact && nextShift.supervisor && (
                <div className="text-right">
                  <p className="text-xs text-base-content/70">Supervisor</p>
                  <p className="text-xs font-medium">{nextShift.supervisor}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {isCompact && timeRemaining && (
          <div className="mt-2 text-center">
            <span className="text-xs text-warning font-medium">
              {timeRemaining} remaining
            </span>
          </div>
        )}
      </div>
    </div>
  );
};