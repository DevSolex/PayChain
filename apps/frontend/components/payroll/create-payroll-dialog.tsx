'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Employee } from '@/types'

interface Props { open: boolean; onClose: () => void }

export function CreatePayrollDialog({ open, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ employeeId: '', amount: '', token: 'USDC', paymentDate: '' })
  const [error, setError] = useState('')

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: async () => (await api.get('/employees?status=ACTIVE')).data.data,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/payroll', { ...data, amount: parseFloat(data.amount), paymentDate: new Date(data.paymentDate).toISOString() }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['payrolls'] }); onClose(); setForm({ employeeId: '', amount: '', token: 'USDC', paymentDate: '' }) },
    onError: (err: unknown) => setError((err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Failed'),
  })

  function set(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })) }

  // Auto-fill salary when employee selected
  function onEmployeeChange(id: string) {
    const emp = employees.find(e => e.id === id)
    setForm(p => ({ ...p, employeeId: id, amount: emp ? String(emp.salary) : p.amount, token: emp ? emp.token : p.token }))
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border rounded-lg p-6 w-full max-w-md space-y-4 shadow-xl">
        <h2 className="text-lg font-semibold">Create Payroll</h2>
        {error && <div className="p-3 rounded bg-destructive/10 text-destructive text-sm">{error}</div>}
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Employee</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.employeeId} onChange={(e) => onEmployeeChange(e.target.value)}>
              <option value="">Select employee...</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name} — {e.email}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input type="number" placeholder="5000" value={form.amount} onChange={(e) => set('amount', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Token</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.token} onChange={(e) => set('token', e.target.value)}>
                {['USDC', 'USDT', 'XLM'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <Label>Payment Date</Label>
            <Input type="datetime-local" value={form.paymentDate} onChange={(e) => set('paymentDate', e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => mutation.mutate(form)} disabled={mutation.isPending || !form.employeeId}>
            {mutation.isPending ? 'Creating...' : 'Create Payroll'}
          </Button>
        </div>
      </div>
    </div>
  )
}
