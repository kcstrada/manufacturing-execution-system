'use client'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const data = [
  { day: 'Mon', planned: 2400, actual: 2210, efficiency: 92 },
  { day: 'Tue', planned: 2300, actual: 2380, efficiency: 103 },
  { day: 'Wed', planned: 2500, actual: 2290, efficiency: 91 },
  { day: 'Thu', planned: 2450, actual: 2480, efficiency: 101 },
  { day: 'Fri', planned: 2600, actual: 2520, efficiency: 97 },
  { day: 'Sat', planned: 1800, actual: 1890, efficiency: 105 },
  { day: 'Sun', planned: 1200, actual: 1150, efficiency: 96 },
]

export function ProductionChart() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#056389" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#056389" stopOpacity={0}/>
          </linearGradient>
          <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6CAECF" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6CAECF" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="day"
          stroke="#00253a"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#00253a"
          style={{ fontSize: '12px' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #056389',
            borderRadius: '8px',
            fontSize: '12px'
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: '12px' }}
        />
        <Area
          type="monotone"
          dataKey="planned"
          stroke="#056389"
          fillOpacity={1}
          fill="url(#colorPlanned)"
          strokeWidth={2}
          name="Planned Production"
        />
        <Area
          type="monotone"
          dataKey="actual"
          stroke="#6CAECF"
          fillOpacity={1}
          fill="url(#colorActual)"
          strokeWidth={2}
          name="Actual Production"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}