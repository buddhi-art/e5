'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'

interface BudgetChartProps {
 consumed: number;
 remaining: number;
}

export function BudgetChart({ consumed, remaining }: BudgetChartProps) {
 const data = [
 { name: 'Consumed', value: consumed },
 { name: 'Remaining', value: remaining > 0 ? remaining : 0 },
 ]

 const COLORS = ['#0ea5e9', '#e4e4e7'] // sky-500, zinc-200
 // For dark mode we might want different colors, but recharts is tricky with CSS variables sometimes.
 // Assuming light/dark mode handles zinc-200 / zinc-800 mostly.

 return (
 <div className="w-full h-48 mt-4">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={data}
 cx="50%"
 cy="50%"
 innerRadius={50}
 outerRadius={70}
 paddingAngle={2}
 dataKey="value"
 stroke="none"
 >
 {data.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Pie>
 <Tooltip 
 formatter={(value: any) => `${Number(value).toLocaleString()} NPR`}
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
 />
 <Legend verticalAlign="bottom" height={36} iconType="circle" />
 </PieChart>
 </ResponsiveContainer>
 </div>
 )
}
