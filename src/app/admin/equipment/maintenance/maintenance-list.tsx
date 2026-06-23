'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react'
import { updateMaintenanceStatus } from '../actions'
import { toast } from 'sonner'

export function MaintenanceList({ initialRecords }: { initialRecords: any[] }) {
  const [tab, setTab] = useState<'scheduled' | 'in_progress' | 'completed'>('scheduled')

  const filteredRecords = initialRecords.filter(r => r.status === tab)

  async function handleStatusChange(id: string, status: 'scheduled' | 'in_progress' | 'completed') {
    const result = await updateMaintenanceStatus(id, status)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(`Maintenance marked as ${status.replace('_', ' ')}`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex border-b border-zinc-200 dark:border-zinc-800">
        <button
          className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${tab === 'scheduled' ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setTab('scheduled')}
        >
          Scheduled
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${tab === 'in_progress' ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setTab('in_progress')}
        >
          In Progress
        </button>
        <button
          className={`pb-2 px-4 text-sm font-medium transition-colors border-b-2 ${tab === 'completed' ? 'border-zinc-900 dark:border-white text-zinc-900 dark:text-white' : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
          onClick={() => setTab('completed')}
        >
          Completed
        </button>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-800/50 uppercase border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-3 font-medium">Equipment</th>
                <th className="px-6 py-3 font-medium">Description</th>
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Vendor & Cost</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                    No {tab.replace('_', ' ')} maintenance records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-zinc-900 dark:text-white">{record.equipment?.name}</p>
                      <p className="text-xs text-zinc-500">{record.equipment?.category} • {record.equipment?.serial_number}</p>
                    </td>
                    <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                      {record.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {tab === 'completed' ? (
                        <>
                          <span className="block text-zinc-900 dark:text-white">{record.completed_date ? format(new Date(record.completed_date), 'MMM d, yyyy') : '-'}</span>
                          <span className="text-xs text-zinc-500">Completed</span>
                        </>
                      ) : (
                        <>
                          <span className="block text-zinc-900 dark:text-white">{format(new Date(record.scheduled_date), 'MMM d, yyyy')}</span>
                          <span className="text-xs text-zinc-500">Scheduled</span>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="block text-zinc-900 dark:text-white">{record.vendor || '-'}</span>
                      <span className="text-xs text-zinc-500">{record.cost ? `NPR ${record.cost.toLocaleString()}` : '-'}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" nativeButton={false} />}>
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tab !== 'scheduled' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'scheduled')}>
                              Mark as Scheduled
                            </DropdownMenuItem>
                          )}
                          {tab !== 'in_progress' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'in_progress')}>
                              Mark as In Progress
                            </DropdownMenuItem>
                          )}
                          {tab !== 'completed' && (
                            <DropdownMenuItem onClick={() => handleStatusChange(record.id, 'completed')}>
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
