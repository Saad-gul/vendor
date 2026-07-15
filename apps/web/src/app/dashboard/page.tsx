'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.analytics.platform().then((res) => setStats(res.data)).catch(() => setStats({}));
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.totalUsers ?? '-' },
    { label: 'Total Vendors', value: stats?.totalVendors ?? '-' },
    { label: 'Total Products', value: stats?.totalProducts ?? '-' },
    { label: 'Total Orders', value: stats?.totalOrders ?? '-' },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
