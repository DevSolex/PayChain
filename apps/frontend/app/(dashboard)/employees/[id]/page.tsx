'use client'

import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, shortenAddress } from '@/lib/utils'
import type { Employee, Payroll } from '@/types'

interface EmployeeWithPayrolls extends Employee {
  payrolls: Payroll[]
}

const statusVariant: Record<string, 'success' | 'warning' | 'destructive' | 'secondary'> = {
  EXECUTED: 'success', PENDING: 'warning', FAILED: 'destructive', CANCELLED: 'secondary', APPROVED: 'secondary',
}

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()

  const { data: employee, isLoading } = useQuery<EmployeeWithPayrolls>({
    queryKey: ['employee', id],
    queryFn: async () => (await api.get(`/employees/${id}`)).data.data,
  })

  if (isLoading) return <div className="h-64 bg-muted rounded-lg animate-pulse" />
  if (!employee) return <p className="text-muted-foreground">Employee not found.</p>

  const totalEarned = employee.payrolls.filter(p => p.status === 'EXECUTED').reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/employees" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to Employees
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-lg">
                {employee.name[0]}
              </div>
              <div>
                <CardTitle>{employee.name}</CardTitle>
                <p className="text-sm text-muted-foreground">{employee.email}</p>
                {employee.title && <p className="text-xs text-muted-foreground">{employee.title}</p>}
              </div>
            </div>
            <Badge variant={employee.status === 'ACTIVE' ? 'success' : 'warning'}>{employee.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted-foreground">Salary</p><p className="font-medium">{formatCurrency(employee.salary, employee.token)}</p></div>
          <div><p className="text-muted-foreground">Frequency</p><p className="font-medium capitalize">{employee.paymentFrequency.toLowerCase()}</p></div>
          <div><p className="text-muted-foreground">Wallet</p><p className="font-mono">{shortenAddress(employee.walletAddress, 6)}</p></div>
          <div><p className="text-muted-foreground">Total Earned</p><p className="font-medium text-green-500">{formatCurrency(totalEarned, employee.token)}</p></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Payment History</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Token</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tx Hash</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employee.payrolls.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No payments yet</TableCell></TableRow>
              ) : employee.payrolls.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{formatDate(p.paymentDate)}</TableCell>
                  <TableCell>{formatCurrency(Number(p.amount), p.token)}</TableCell>
                  <TableCell>{p.token}</TableCell>
                  <TableCell><Badge variant={statusVariant[p.status]}>{p.status}</Badge></TableCell>
                  <TableCell className="font-mono text-xs">{p.txHash ? shortenAddress(p.txHash) : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
