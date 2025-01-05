'use client';

import { useEffect, useState } from 'react';
import { DateRange } from 'react-day-picker';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
} from 'chart.js';
import { format, parseISO } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface UsageData {
  id: string;
  timestamp: string; // ISO string format
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface AggregatedStats {
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
}

interface UsageStatsDisplayProps {
  dateRange?: DateRange;
}

export default function UsageStatsDisplay({ dateRange }: UsageStatsDisplayProps) {
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedStats | null>(null);
  const [chartData, setChartData] = useState<ChartData<'line'>>({
    labels: [],
    datasets: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params = new URLSearchParams();
        if (dateRange?.from) {
          params.append('startDate', dateRange.from.toISOString());
        }
        if (dateRange?.to) {
          params.append('endDate', dateRange.to.toISOString());
        }

        const response = await fetch(`/api/admin/stats?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch stats');
        }

        setUsageData(data.data.stats);
        setAggregatedStats(data.data.aggregated);

        // Prepare chart data
        const dates = data.data.stats.map((stat: UsageData) => 
          format(parseISO(stat.timestamp), 'MMM dd')
        ).reverse();
        
        const tokenData = data.data.stats.map((stat: UsageData) => stat.totalTokens).reverse();

        setChartData({
          labels: dates,
          datasets: [
            {
              label: 'Total Tokens Used',
              data: tokenData,
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching usage stats:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      }
    };

    fetchData();
  }, [dateRange]);

  if (error) {
    return (
      <div className="p-4 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg">
        Error: {error}
      </div>
    );
  }

  if (!usageData.length || !aggregatedStats) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium">Total Requests</h3>
          <p className="text-2xl font-bold">{aggregatedStats.totalRequests}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium">Total Tokens</h3>
          <p className="text-2xl font-bold">{aggregatedStats.totalTokens}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium">Prompt Tokens</h3>
          <p className="text-2xl font-bold">{aggregatedStats.totalPromptTokens}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium">Completion Tokens</h3>
          <p className="text-2xl font-bold">{aggregatedStats.totalCompletionTokens}</p>
        </Card>
      </div>

      <div className="h-[300px]">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top' as const,
              },
              title: {
                display: true,
                text: 'Token Usage Over Time',
              },
            },
          }}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Prompt Tokens</TableHead>
              <TableHead>Completion Tokens</TableHead>
              <TableHead>Total Tokens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usageData.map((stat) => (
              <TableRow key={stat.id}>
                <TableCell>
                  {format(parseISO(stat.timestamp), 'MMM dd, yyyy HH:mm')}
                </TableCell>
                <TableCell>{stat.userId}</TableCell>
                <TableCell>{stat.model}</TableCell>
                <TableCell>{stat.promptTokens}</TableCell>
                <TableCell>{stat.completionTokens}</TableCell>
                <TableCell>{stat.totalTokens}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 