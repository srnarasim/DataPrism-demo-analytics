/**
 * Chart Renderer Component
 * Renders charts using Chart.js
 */

import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartConfig {
  type: 'bar' | 'line' | 'pie';
  data: any[];
  xAxis: string;
  yAxis: string;
  groupBy?: string;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
  title?: string;
  colors?: string[];
}

interface ChartRendererProps {
  config: ChartConfig;
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ config }) => {
  const processedData = useMemo(() => {
    if (!config.data || !config.xAxis || !config.yAxis) {
      return null;
    }

    const { data, xAxis, yAxis, groupBy, aggregation = 'sum' } = config;

    if (config.type === 'pie') {
      // For pie charts, aggregate by xAxis
      const aggregated = new Map();
      
      data.forEach(row => {
        const key = String(row[xAxis]);
        const value = Number(row[yAxis]) || 0;
        
        if (aggregated.has(key)) {
          const current = aggregated.get(key);
          switch (aggregation) {
            case 'sum':
              aggregated.set(key, current + value);
              break;
            case 'avg':
              aggregated.set(key, { sum: current.sum + value, count: current.count + 1 });
              break;
            case 'count':
              aggregated.set(key, current + 1);
              break;
            case 'min':
              aggregated.set(key, Math.min(current, value));
              break;
            case 'max':
              aggregated.set(key, Math.max(current, value));
              break;
          }
        } else {
          switch (aggregation) {
            case 'avg':
              aggregated.set(key, { sum: value, count: 1 });
              break;
            case 'count':
              aggregated.set(key, 1);
              break;
            default:
              aggregated.set(key, value);
          }
        }
      });

      const labels: string[] = [];
      const values: number[] = [];
      
      aggregated.forEach((value, key) => {
        labels.push(key);
        if (aggregation === 'avg' && typeof value === 'object') {
          values.push(value.sum / value.count);
        } else {
          values.push(Number(value));
        }
      });

      return {
        labels,
        datasets: [{
          data: values,
          backgroundColor: config.colors || [
            '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
            '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
        }]
      };
    } else {
      // For bar and line charts
      if (groupBy) {
        // Group by a field
        const groups = new Map();
        
        data.forEach(row => {
          const groupKey = String(row[groupBy]);
          const xValue = String(row[xAxis]);
          const yValue = Number(row[yAxis]) || 0;
          
          if (!groups.has(groupKey)) {
            groups.set(groupKey, new Map());
          }
          
          const groupData = groups.get(groupKey);
          if (groupData.has(xValue)) {
            const current = groupData.get(xValue);
            switch (aggregation) {
              case 'sum':
                groupData.set(xValue, current + yValue);
                break;
              case 'avg':
                groupData.set(xValue, { sum: current.sum + yValue, count: current.count + 1 });
                break;
              case 'count':
                groupData.set(xValue, current + 1);
                break;
              case 'min':
                groupData.set(xValue, Math.min(current, yValue));
                break;
              case 'max':
                groupData.set(xValue, Math.max(current, yValue));
                break;
            }
          } else {
            switch (aggregation) {
              case 'avg':
                groupData.set(xValue, { sum: yValue, count: 1 });
                break;
              case 'count':
                groupData.set(xValue, 1);
                break;
              default:
                groupData.set(xValue, yValue);
            }
          }
        });

        // Get all unique x values
        const allXValues = new Set<string>();
        groups.forEach(groupData => {
          groupData.forEach((_: any, xValue: string) => {
            allXValues.add(xValue);
          });
        });
        
        const labels = Array.from(allXValues).sort();
        const datasets: any[] = [];
        const colors = config.colors || ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
        
        let colorIndex = 0;
        groups.forEach((groupData, groupKey) => {
          const values = labels.map(label => {
            const value = groupData.get(label);
            if (value === undefined) return 0;
            if (aggregation === 'avg' && typeof value === 'object') {
              return value.sum / value.count;
            }
            return Number(value);
          });
          
          datasets.push({
            label: groupKey,
            data: values,
            backgroundColor: colors[colorIndex % colors.length],
            borderColor: colors[colorIndex % colors.length],
            borderWidth: 2,
          });
          
          colorIndex++;
        });

        return { labels, datasets };
      } else {
        // Simple aggregation by xAxis
        const aggregated = new Map();
        
        data.forEach(row => {
          const key = String(row[xAxis]);
          const value = Number(row[yAxis]) || 0;
          
          if (aggregated.has(key)) {
            const current = aggregated.get(key);
            switch (aggregation) {
              case 'sum':
                aggregated.set(key, current + value);
                break;
              case 'avg':
                aggregated.set(key, { sum: current.sum + value, count: current.count + 1 });
                break;
              case 'count':
                aggregated.set(key, current + 1);
                break;
              case 'min':
                aggregated.set(key, Math.min(current, value));
                break;
              case 'max':
                aggregated.set(key, Math.max(current, value));
                break;
            }
          } else {
            switch (aggregation) {
              case 'avg':
                aggregated.set(key, { sum: value, count: 1 });
                break;
              case 'count':
                aggregated.set(key, 1);
                break;
              default:
                aggregated.set(key, value);
            }
          }
        });

        const labels: string[] = [];
        const values: number[] = [];
        
        aggregated.forEach((value, key) => {
          labels.push(key);
          if (aggregation === 'avg' && typeof value === 'object') {
            values.push(value.sum / value.count);
          } else {
            values.push(Number(value));
          }
        });

        return {
          labels,
          datasets: [{
            label: config.title || `${aggregation} of ${yAxis}`,
            data: values,
            backgroundColor: config.colors?.[0] || '#3B82F6',
            borderColor: config.colors?.[0] || '#3B82F6',
            borderWidth: 2,
          }]
        };
      }
    }
  }, [config]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: !!config.title,
        text: config.title,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
      },
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: config.type !== 'pie' ? {
      x: {
        title: {
          display: true,
          text: config.xAxis,
        },
      },
      y: {
        title: {
          display: true,
          text: config.yAxis,
        },
        beginAtZero: true,
      },
    } : undefined,
  };

  if (!processedData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64 text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>Configure fields to see chart</p>
          </div>
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (config.type) {
      case 'bar':
        return <Bar data={processedData} options={chartOptions} />;
      case 'line':
        return <Line data={processedData} options={chartOptions} />;
      case 'pie':
        return <Pie data={processedData} options={chartOptions} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="h-96">
        {renderChart()}
      </div>
    </div>
  );
};