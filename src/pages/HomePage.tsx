/**
 * Home Page for Standalone DataPrism Demo Analytics
 * Demonstrates CDN-based DataPrism integration
 */

import React from 'react';
import { useDataPrism } from '@/contexts/DataPrismContext';
import { CDNStatus } from '@/components/CDNStatus';
import { getCDNConfig } from '@/config/cdn';

export const HomePage: React.FC = () => {
  const { isInitialized, cdnInfo } = useDataPrism();
  const cdnConfig = getCDNConfig();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          DataPrism Demo Analytics
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Standalone demo application showcasing DataPrism's powerful analytics capabilities.
          This application loads DataPrism directly from CDN, demonstrating best practices 
          for external integration.
        </p>
      </header>
      
      <div className="mb-8">
        <CDNStatus />
      </div>

      {isInitialized ? (
        <div className="space-y-8">
          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              title="Data Explorer"
              description="Import and explore datasets with DataPrism's powerful analytics engine."
              icon="📊"
              href="/data-explorer"
              color="blue"
            />
            
            <FeatureCard
              title="Query Lab"
              description="Write and execute SQL queries against your data with real-time results."
              icon="🔍"
              href="/query-lab"
              color="green"
            />
            
            <FeatureCard
              title="Visualization Studio"
              description="Create interactive charts and visualizations from your data."
              icon="📈"
              href="/visualization"
              color="purple"
            />
            
            <FeatureCard
              title="Performance Dashboard"
              description="Monitor query performance and system metrics in real-time."
              icon="⚡"
              href="/performance"
              color="orange"
            />
            
            <FeatureCard
              title="Plugin Showcase"
              description="Explore DataPrism's extensible plugin system and custom integrations."
              icon="🔌"
              href="/plugins"
              color="indigo"
            />
            
            <FeatureCard
              title="About & Documentation"
              description="Learn more about DataPrism and this standalone demo application."
              icon="📚"
              href="/about"
              color="gray"
            />
          </div>

          {/* CDN Integration Info */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              📡 CDN Integration Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <InfoItem
                label="CDN Source"
                value="GitHub Pages"
                detail={cdnConfig.baseUrl}
              />
              <InfoItem
                label="Bundle Format"
                value="UMD + ES Modules"
                detail="Universal compatibility"
              />
              <InfoItem
                label="Asset Integrity"
                value="SHA-384 Verified"
                detail="Cryptographic validation"
              />
              <InfoItem
                label="Version"
                value={cdnInfo.version || 'Loading...'}
                detail="Automatically managed"
              />
              <InfoItem
                label="Load Time"
                value={cdnInfo.latency ? `${cdnInfo.latency}ms` : 'N/A'}
                detail="Initial CDN response"
              />
              <InfoItem
                label="Availability"
                value={cdnInfo.available ? 'Online' : 'Unknown'}
                detail="Real-time status"
              />
            </div>
          </div>

          {/* Sample Data Info */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-900">
              🗃️ Available Sample Datasets
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <DatasetCard
                name="Sales Data"
                records="1,000"
                description="Regional sales transactions with products and salespeople"
                table="sales"
              />
              <DatasetCard
                name="Analytics Data"
                records="5,000"
                description="User behavior and traffic analytics with conversion tracking"
                table="analytics"
              />
              <DatasetCard
                name="Product Catalog"
                records="200"
                description="E-commerce product information with ratings and inventory"
                table="products"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Loading DataPrism from CDN...</p>
          <p className="text-sm text-gray-500">
            This may take a few seconds for initial WASM compilation
          </p>
        </div>
      )}
    </div>
  );
};

// Helper Components

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon, href, color }) => {
  const colorClasses = {
    blue: 'hover:bg-blue-50 border-blue-200 hover:border-blue-300',
    green: 'hover:bg-green-50 border-green-200 hover:border-green-300',
    purple: 'hover:bg-purple-50 border-purple-200 hover:border-purple-300',
    orange: 'hover:bg-orange-50 border-orange-200 hover:border-orange-300',
    indigo: 'hover:bg-indigo-50 border-indigo-200 hover:border-indigo-300',
    gray: 'hover:bg-gray-50 border-gray-200 hover:border-gray-300',
  };

  return (
    <a
      href={href}
      className={`block p-6 bg-white rounded-lg border-2 transition-all duration-200 ${colorClasses[color as keyof typeof colorClasses]}`}
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-gray-900">{title}</h3>
      <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
    </a>
  );
};

interface InfoItemProps {
  label: string;
  value: string;
  detail?: string;
}

const InfoItem: React.FC<InfoItemProps> = ({ label, value, detail }) => (
  <div>
    <dt className="font-medium text-gray-700">{label}</dt>
    <dd className="text-gray-900">{value}</dd>
    {detail && <dd className="text-xs text-gray-500 mt-1">{detail}</dd>}
  </div>
);

interface DatasetCardProps {
  name: string;
  records: string;
  description: string;
  table: string;
}

const DatasetCard: React.FC<DatasetCardProps> = ({ name, records, description, table }) => (
  <div className="bg-white p-4 rounded border">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-gray-900">{name}</h4>
      <span className="text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded">
        {records} rows
      </span>
    </div>
    <p className="text-sm text-gray-600 mb-2">{description}</p>
    <p className="text-xs text-gray-500">Table: <code className="bg-gray-100 px-1 rounded">{table}</code></p>
  </div>
);