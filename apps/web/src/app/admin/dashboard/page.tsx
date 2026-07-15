'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<any[]>([]);
  const [pendingVendors, setPendingVendors] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    api.analytics.platform().then((r) => setStats(r.data)).catch(() => setStats({}));
    api.admin.users().then((r) => setUsers(r.data.data || [])).catch(() => setUsers([]));
    api.admin.pendingVendors().then((r) => setPendingVendors(r.data.data || [])).catch(() => setPendingVendors([]));
    api.admin.products().then((r) => setProducts(r.data.data || [])).catch(() => setProducts([]));
  }, [refresh]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Users', value: stats.totalUsers ?? '-' },
              { label: 'Total Vendors', value: stats.totalVendors ?? '-' },
              { label: 'Total Products', value: stats.totalProducts ?? '-' },
              { label: 'Total Orders', value: stats.totalOrders ?? '-' },
            ].map((c) => (
              <Card key={c.label}>
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="users">
          <UserManager users={users} onChange={() => setRefresh((r) => r + 1)} />
        </TabsContent>
        <TabsContent value="vendors">
          <VendorManager pending={pendingVendors} onChange={() => setRefresh((r) => r + 1)} />
        </TabsContent>
        <TabsContent value="products">
          <ProductManager products={products} onChange={() => setRefresh((r) => r + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UserManager({ users, onChange }: { users: any[]; onChange: () => void }) {
  async function updateRole(id: string, role: string) {
    await api.admin.updateRole(id, role);
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Users</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Verified</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell>{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>{u.role}</TableCell>
                <TableCell>{u.emailVerified ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Select value={u.role} onValueChange={(v) => updateRole(u.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['CUSTOMER', 'VENDOR', 'ADMIN'].map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function VendorManager({ pending, onChange }: { pending: any[]; onChange: () => void }) {
  async function verify(id: string) {
    await api.admin.verifyVendor(id);
    onChange();
  }

  async function updateCommission(id: string, rate: number) {
    await api.admin.updateCommission(id, rate);
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Pending Vendors</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Store</TableHead><TableHead>Owner</TableHead><TableHead>Commission</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {pending.map((v) => (
              <TableRow key={v.id}>
                <TableCell>{v.storeName}</TableCell>
                <TableCell>{v.user?.email}</TableCell>
                <TableCell>
                  <Input type="number" defaultValue={v.commissionRate} className="w-24" onBlur={(e) => updateCommission(v.id, Number(e.target.value))} />
                </TableCell>
                <TableCell>
                  <Button size="sm" onClick={() => verify(v.id)}>Verify</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function ProductManager({ products, onChange }: { products: any[]; onChange: () => void }) {
  async function suspend(id: string) {
    if (!confirm('Suspend product?')) return;
    await api.admin.suspendProduct(id);
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Products</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Vendor</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.vendor?.storeName}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell><Button variant="destructive" size="sm" onClick={() => suspend(p.id)}>Suspend</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
