import React from 'react';

export interface TableColumn<T = any> {
  key: string;
  header: string;
  width?: string;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  className?: string;
  variant?: 'default' | 'zebra' | 'compact';
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
}

export const Table = <T extends Record<string, any>>({ 
  columns, 
  data, 
  className = '',
  variant = 'default',
  loading = false,
  emptyMessage = 'No data available',
  onRowClick
}: TableProps<T>) => {
  const variantClasses = {
    default: 'table',
    zebra: 'table table-zebra',
    compact: 'table table-compact'
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`${variantClasses[variant]} w-full ${className}`}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={column.sortable ? 'cursor-pointer hover:bg-base-200' : ''}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-8 text-base-content/70">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row, index)}
                className={onRowClick ? 'cursor-pointer hover:bg-base-200' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render 
                      ? column.render(row[column.key], row, index)
                      : row[column.key]
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};