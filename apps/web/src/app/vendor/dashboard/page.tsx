'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatPrice } from '@/lib/utils';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function VendorDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<any>({});
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    api.analytics.vendor().then((r) => setStats(r.data)).catch(() => setStats({}));
    api.products.listMy().then((r) => setProducts(r.data.data || [])).catch(() => setProducts([]));
    api.orders.list().then((r) => setOrders(r.data.data || [])).catch(() => setOrders([]));
    api.coupons.list().then((r) => setCoupons(r.data.data || [])).catch(() => setCoupons([]));
    api.categories.list().then((r) => setCategories(r.data.data || [])).catch(() => setCategories([]));
  }, [refresh]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Vendor Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="coupons">Coupons</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Total Revenue', value: stats.totalRevenue ?? '-' },
              { label: 'Total Orders', value: stats.totalOrders ?? '-' },
              { label: 'Total Products', value: stats.totalProducts ?? '-' },
              { label: 'Low Stock Items', value: stats.lowStockProducts ?? '-' },
            ].map((c) => (
              <Card key={c.label}>
                <CardHeader><CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle></CardHeader>
                <CardContent><p className="text-3xl font-bold">{c.value}</p></CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Revenue by Month</CardTitle></CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.salesByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatPrice(value)} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <SalesInsights />
          </div>
        </TabsContent>
        <TabsContent value="products">
          <ProductManager products={products} categories={categories} onChange={() => setRefresh((r) => r + 1)} />
        </TabsContent>
        <TabsContent value="orders">
          <OrderManager orders={orders} onChange={() => setRefresh((r) => r + 1)} />
        </TabsContent>
        <TabsContent value="coupons">
          <CouponManager coupons={coupons} onChange={() => setRefresh((r) => r + 1)} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SalesInsights() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await api.ai.salesInsights().catch(() => null);
      setInsights(res?.data?.insights || 'AI insights unavailable');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle>AI Sales Insights</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground whitespace-pre-line">{insights || 'Click below to generate AI sales insights.'}</p>
        <Button onClick={load} disabled={loading} size="sm">{loading ? 'Generating...' : 'Generate Insights'}</Button>
      </CardContent>
    </Card>
  );
}

function ProductManager({ products, categories, onChange }: { products: any[]; categories: any[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [aiLoading, setAiLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.products.create({ ...form, price: Number(form.price), stock: Number(form.stock), lowStockThreshold: Number(form.lowStockThreshold || 5) });
    setOpen(false);
    setForm({});
    onChange();
  }

  async function generateDescription() {
    if (!form.name) return;
    setAiLoading(true);
    try {
      const res = await api.ai.productDescription({ name: form.name, keywords: form.tags ? form.tags.split(',') : [] });
      setForm({ ...form, description: res.data.description });
    } finally {
      setAiLoading(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!confirm('Delete product?')) return;
    await api.products.delete(id);
    onChange();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Products</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Add Product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label>Category</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm({ ...form, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Price</Label><Input type="number" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: e.target.value })} required /></div>
              <div><Label>SKU</Label><Input value={form.sku || ''} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
              <div><Label>Tags (comma separated)</Label><Input value={form.tags || ''} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
              <div>
                <Label>Description</Label>
                <Textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                <Button type="button" variant="outline" size="sm" className="mt-2" onClick={generateDescription} disabled={aiLoading}>
                  {aiLoading ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
              <Button type="submit" className="w-full">Create Product</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Name</TableHead><TableHead>Price</TableHead><TableHead>Stock</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{formatPrice(p.price)}</TableCell>
                <TableCell>{p.stock}</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => deleteProduct(p.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function OrderManager({ orders, onChange }: { orders: any[]; onChange: () => void }) {
  const [status, setStatus] = useState<Record<string, string>>({});

  async function update(id: string) {
    await api.orders.updateStatus(id, status[id]);
    onChange();
  }

  return (
    <Card>
      <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Order</TableHead><TableHead>Date</TableHead><TableHead>Total</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((o) => (
              <TableRow key={o.id}>
                <TableCell>#{o.id.slice(0, 8)}</TableCell>
                <TableCell>{new Date(o.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>{formatPrice(o.total)}</TableCell>
                <TableCell>{o.status}</TableCell>
                <TableCell className="flex items-center gap-2">
                  <Select value={status[o.id] || o.status} onValueChange={(v) => setStatus({ ...status, [o.id]: v })}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={() => update(o.id)}>Update</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function CouponManager({ coupons, onChange }: { coupons: any[]; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await api.coupons.create({ ...form, value: Number(form.value), minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined, maxUses: form.maxUses ? Number(form.maxUses) : undefined });
    setOpen(false);
    setForm({});
    onChange();
  }

  async function remove(id: string) {
    if (!confirm('Delete coupon?')) return;
    await api.coupons.delete(id);
    onChange();
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Coupons</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button>Add Coupon</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Coupon</DialogTitle></DialogHeader>
            <form onSubmit={submit} className="space-y-4">
              <div><Label>Code</Label><Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
              <div><Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FIXED">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Value</Label><Input type="number" value={form.value || ''} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
              <div><Label>Min Order Amount</Label><Input type="number" value={form.minOrderAmount || ''} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} /></div>
              <div><Label>Max Uses</Label><Input type="number" value={form.maxUses || ''} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
              <div><Label>Expires At</Label><Input type="datetime-local" value={form.expiresAt || ''} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
              <Button type="submit" className="w-full">Create Coupon</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Code</TableHead><TableHead>Type</TableHead><TableHead>Value</TableHead><TableHead>Used</TableHead><TableHead></TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.code}</TableCell>
                <TableCell>{c.type}</TableCell>
                <TableCell>{c.value}</TableCell>
                <TableCell>{c.usedCount}</TableCell>
                <TableCell><Button variant="ghost" size="sm" onClick={() => remove(c.id)}>Delete</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
