/**
 * Chart Type Selector Component
 * Allows users to choose between different chart types
 */

import React from 'react';
import { BarChart3, LineChart, PieChart } from 'lucide-react';

interface ChartTypeSelectorProps {
  selectedType: 'bar' | 'line' | 'pie';
  onTypeChange: (type: 'bar' | 'line' | 'pie') => void;
}

export const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({
  selectedType,
  onTypeChange,
}) => {
  const chartTypes = [
    {
      type: 'bar' as const,
      name: 'Bar Chart',
      icon: BarChart3,
      description: 'Compare values across categories',
      bestFor: 'Categorical data with numerical values',
    },
    {
      type: 'line' as const,
      name: 'Line Chart',
      icon: LineChart,
      description: 'Show trends over time',
      bestFor: 'Time series data or continuous values',
    },
    {
      type: 'pie' as const,
      name: 'Pie Chart',
      icon: PieChart,
      description: 'Show proportions of a whole',
      bestFor: 'Parts of a total (percentages)',
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Chart Type</h3>
      
      <div className="space-y-3">
        {chartTypes.map((chart) => {
          const Icon = chart.icon;
          const isSelected = selectedType === chart.type;
          
          return (
            <div
              key={chart.type}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onTypeChange(chart.type)}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Icon className={`w-5 h-5 ${
                    isSelected ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    isSelected ? 'text-blue-900' : 'text-gray-900'
                  }`}>
                    {chart.name}
                  </h4>
                  <p className={`text-sm mt-1 ${
                    isSelected ? 'text-blue-700' : 'text-gray-600'
                  }`}>
                    {chart.description}
                  </p>
                  <p className={`text-xs mt-1 ${
                    isSelected ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    Best for: {chart.bestFor}
                  </p>
                </div>
                
                {isSelected && (
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};