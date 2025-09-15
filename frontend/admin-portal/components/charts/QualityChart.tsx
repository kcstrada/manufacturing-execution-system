'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

const data = [
  { name: 'Passed', value: 2185, percentage: 98.5 },
  { name: 'Failed', value: 35, percentage: 1.5 },
]

const COLORS = {
  Passed: '#10b981',
  Failed: '#ef4444',
}

export function QualityChart() {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-unimore-blue/20">
          <p className="text-sm font-semibold text-unimore-navy">
            {payload[0].name}
          </p>
          <p className="text-sm text-unimore-navy/80">
            Count: {payload[0].value}
          </p>
          <p className="text-sm text-unimore-navy/80">
            {payload[0].payload.percentage}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ percentage }) => `${percentage}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          wrapperStyle={{ fontSize: '12px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}