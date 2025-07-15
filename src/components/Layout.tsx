/**
 * Shared Layout Component
 * Provides navigation and consistent layout for all pages
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Database, Search, BarChart3, ArrowLeft } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, title, description }) => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const navigationItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/data-explorer', label: 'Data Explorer', icon: Database },
    { path: '/query-lab', label: 'Query Lab', icon: Search },
    { path: '/visualization', label: 'Visualization', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="text-2xl">📊</div>
                <span className="text-xl font-semibold text-gray-900">
                  DataPrism Demo
                </span>
              </Link>
            </div>

            <nav className="flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Page Header */}
      {!isHomePage && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center space-x-3">
              <Link
                to="/"
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="mt-1 text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
};