'use client';

import { useState } from 'react';
import { DateRange } from 'react-day-picker';
import { Card } from '@/components/ui/card';
import UsageStatsDisplay from '@/components/admin/usage-stats-display';
import { DateRangePicker } from '@/components/admin/date-range-picker';

export default function AdminPage() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid gap-6">
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Usage Statistics</h2>
          <DateRangePicker 
            className="mb-6" 
            onDateChange={setDateRange}
          />
          <UsageStatsDisplay dateRange={dateRange} />
        </Card>
      </div>
    </div>
  );
} 