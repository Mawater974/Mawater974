'use client';

import { useEffect, useState } from 'react';

interface PageView {
  view_count: number;
  page_type: string;
  country_code: string;
  last_viewed_at: string;
}

interface UserPageView {
  id: string;
  user_id?: string;
  session_id: string;
  country_code: string;
  page_type: string;
  entity_id?: string;
  page_path: string;
  created_at: string;
  user_agent?: string;
  is_authenticated: boolean;
}

import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/contexts/LanguageContext';
import { PageType } from '@/lib/analytics/page-views';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

function detectDevice(userAgent: string | undefined): string {
  if (!userAgent) return 'unknown';
  
  // Simple device detection using user agent
  if (/mobile|android|iphone|ipad/i.test(userAgent)) {
    return 'mobile';
  }
  if (/tablet/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

function exportToCSV(data: any[], filename: string) {
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row => 
      headers.map(header => {
        const cell = row[header];
        // Handle cells that might contain commas or quotes
        if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"') || cell.includes('\n'))) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

async function exportPageViews() {
  const { data: pageViews, error } = await supabase
    .from('page_views')
    .select('*')
    .order('last_viewed_at', { ascending: false });

  if (error) {
    console.error('Error fetching page views:', error);
    return;
  }

  if (pageViews) {
    exportToCSV(pageViews, 'page-views.csv');
  }
}

async function exportUserPageViews() {
  const { data: userPageViews, error } = await supabase
    .from('user_page_views')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user page views:', error);
    return;
  }

  if (userPageViews) {
    exportToCSV(userPageViews, 'user-page-views.csv');
  }
}

function calculateRetention(views: UserPageView[], now: Date) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const sessions = views.reduce((acc, view) => {
    const sessionId = view.session_id;
    const date = new Date(view.created_at);
    if (!acc[sessionId]) {
      acc[sessionId] = { firstSeen: date, lastSeen: date };
    } else {
      acc[sessionId].lastSeen = date;
    }
    return acc;
  }, {} as Record<string, { firstSeen: Date; lastSeen: Date }>);

  const totalUsers = Object.keys(sessions).length;
  if (totalUsers === 0) return { daily: 0, weekly: 0, monthly: 0 };

  const returnedWithin = (days: number) => {
    const threshold = now.getTime() - (days * msPerDay);
    return Object.values(sessions).filter(({ firstSeen, lastSeen }) => 
      firstSeen.getTime() <= threshold && lastSeen.getTime() >= threshold
    ).length;
  };

  return {
    daily: (returnedWithin(1) / totalUsers) * 100,
    weekly: (returnedWithin(7) / totalUsers) * 100,
    monthly: (returnedWithin(30) / totalUsers) * 100
  };
}

function calculateEngagement(views: UserPageView[]) {
  const sessions = views.reduce((acc, view) => {
    if (!acc[view.session_id]) {
      acc[view.session_id] = {
        pages: new Set([view.page_path]),
        startTime: new Date(view.created_at),
        lastTime: new Date(view.created_at)
      };
    } else {
      acc[view.session_id].pages.add(view.page_path);
      acc[view.session_id].lastTime = new Date(view.created_at);
    }
    return acc;
  }, {} as Record<string, { pages: Set<string>; startTime: Date; lastTime: Date }>);

  const sessionCount = Object.keys(sessions).length;
  if (sessionCount === 0) {
    return { averageSessionDuration: 0, bounceRate: 0, pagesPerSession: 0 };
  }

  const totalDuration = Object.values(sessions).reduce(
    (sum, { startTime, lastTime }) => sum + (lastTime.getTime() - startTime.getTime()),
    0
  );

  const bounceCount = Object.values(sessions).filter(s => s.pages.size === 1).length;
  const totalPages = Object.values(sessions).reduce((sum, s) => sum + s.pages.size, 0);

  return {
    averageSessionDuration: totalDuration / (sessionCount * 1000), // in seconds
    bounceRate: (bounceCount / sessionCount) * 100,
    pagesPerSession: totalPages / sessionCount
  };
}

interface PageViewStats {
  totalViews: number;
  uniqueUsers: number;
  authenticatedUsers: number;
  growthRate: number;
  averageViewsPerDay: number;
  peakHour: { hour: number; views: number };
  topPages: { pageType: string; views: number; trend: number }[];
  viewsByCountry: { country: string; views: number; trend: number }[];
  viewsByDevice: { device: string; views: number }[];
  viewsByHour: { hour: number; views: number }[];
  viewsByDay: { date: string; views: number }[];
  userRetention: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  engagementMetrics: {
    averageSessionDuration: number;
    bounceRate: number;
    pagesPerSession: number;
  };
  recentActivity: {
    timestamp: string;
    pageType: string;
    countryCode: string;
    isAuthenticated: boolean;
    device: string;
    sessionDuration?: number;
  }[];
}

export default function AnalyticsDashboard() {
  const { t, dir } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('24h');
  const [stats, setStats] = useState<PageViewStats>({
    totalViews: 0,
    uniqueUsers: 0,
    authenticatedUsers: 0,
    growthRate: 0,
    averageViewsPerDay: 0,
    peakHour: { hour: 0, views: 0 },
    topPages: [],
    viewsByCountry: [],
    viewsByDevice: [],
    viewsByHour: [],
    viewsByDay: [],
    userRetention: {
      daily: 0,
      weekly: 0,
      monthly: 0
    },
    engagementMetrics: {
      averageSessionDuration: 0,
      bounceRate: 0,
      pagesPerSession: 0
    },
    recentActivity: [],
  });

  useEffect(() => {
    fetchAnalyticsData();
    const interval = setInterval(fetchAnalyticsData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let timeFilter;
      switch (timeRange) {
        case '24h':
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
          break;
        case '7d':
          timeFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
          break;
        case '30d':
          timeFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
          break;
        default:
          timeFilter = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      }

      // Get views from both tables with time comparison
      const { data: currentPageViews, error: currentError } = await supabase
        .from('page_views')
        .select('*');

      if (currentError) throw currentError;

      const { data: previousPageViews, error: previousError } = await supabase
        .from('page_views')
        .select('*')
        .lt('last_viewed_at', timeFilter);

      if (previousError) throw previousError;

      const { data: userViewsData, error: userViewsError } = await supabase
        .from('user_page_views')
        .select('*')
        .order('created_at', { ascending: false });

      if (userViewsError) throw userViewsError;

      const typedCurrentViews = currentPageViews as PageView[];
      const typedPreviousViews = previousPageViews as PageView[];
      const typedUserViews = userViewsData as UserPageView[];

      if (!typedCurrentViews || !typedPreviousViews || !typedUserViews) {
        throw new Error('Failed to fetch analytics data');
      }

      // Basic Stats
      const totalViews = typedCurrentViews.reduce((sum, item) => sum + item.view_count, 0);
      const previousTotalViews = typedPreviousViews.reduce((sum, item) => sum + item.view_count, 0);
      const uniqueUsers = new Set(typedUserViews.map(view => view.session_id)).size;
      const authenticatedUsers = typedUserViews.filter(view => view.is_authenticated).length;

      // Growth and Averages
      const previousViews = typedPreviousViews
        .reduce((sum, view) => sum + view.view_count, 0);
      const growthRate = previousTotalViews > 0 ? ((totalViews - previousTotalViews) / previousTotalViews) * 100 : 0;
      const daysSinceFirst = Math.max(1, Math.ceil((Date.now() - new Date(typedUserViews[typedUserViews.length - 1]?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24)));
      const averageViewsPerDay = totalViews / daysSinceFirst;

      // Device Analysis
      const viewsByDevice = Object.entries(typedUserViews.reduce((acc, view) => {
        const device = view.user_agent ? detectDevice(view.user_agent) : 'unknown';
        acc[device] = (acc[device] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).map(([device, views]) => ({ device, views }));

      // Hourly Analysis
      const viewsByHour = Object.entries(typedUserViews.reduce((acc, view) => {
        const hour = new Date(view.created_at).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>)).map(([hour, views]) => ({ hour: parseInt(hour), views }));

      const peakHour = viewsByHour.reduce((peak, current) => 
        current.views > peak.views ? current : peak, 
        { hour: 0, views: 0 }
      );

      // Daily Views
      const viewsByDay = Object.entries(typedUserViews.reduce((acc, view) => {
        const date = new Date(view.created_at).toISOString().split('T')[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)).map(([date, views]) => ({ date, views }));

      // User Retention
      const retention = calculateRetention(typedUserViews, new Date());

      // Engagement Metrics
      const engagement = calculateEngagement(typedUserViews);

      // Get top pages with trends
      const currentPageCounts = typedCurrentViews.reduce((acc, item) => {
        acc[item.page_type] = (acc[item.page_type] || 0) + item.view_count;
        return acc;
      }, {} as Record<string, number>);

      const previousPageCounts = typedPreviousViews.reduce((acc, item) => {
        acc[item.page_type] = (acc[item.page_type] || 0) + item.view_count;
        return acc;
      }, {} as Record<string, number>);

      const topPages = Object.entries(currentPageCounts)
        .map(([pageType, views]) => {
          const previousViews = previousPageCounts[pageType] || 0;
          const trend = previousViews > 0 ? ((views - previousViews) / previousViews) * 100 : 0;
          return { pageType, views, trend };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);

      // Get views by country
      const countryViewCounts = typedCurrentViews.reduce((acc, item) => {
        acc[item.country_code] = (acc[item.country_code] || 0) + item.view_count;
        return acc;
      }, {} as Record<string, number>);

      const currentCountryCounts = typedCurrentViews.reduce((acc, item) => {
        acc[item.country_code] = (acc[item.country_code] || 0) + item.view_count;
        return acc;
      }, {} as Record<string, number>);

      const previousCountryCounts = typedPreviousViews.reduce((acc, item) => {
        acc[item.country_code] = (acc[item.country_code] || 0) + item.view_count;
        return acc;
      }, {} as Record<string, number>);

      const viewsByCountry = Object.entries(currentCountryCounts)
        .map(([country, views]) => {
          const previousViews = previousCountryCounts[country] || 0;
          const trend = previousViews > 0 ? ((views - previousViews) / previousViews) * 100 : 0;
          return { country, views, trend };
        })
        .sort((a, b) => b.views - a.views);

      // Get recent activity
      const recentActivity = typedUserViews
        .slice(0, 10)
        .map(view => {
          const session = calculateEngagement([view]);
          return {
            timestamp: view.created_at,
            pageType: view.page_type,
            countryCode: view.country_code,
            isAuthenticated: view.is_authenticated,
            device: view.user_agent ? detectDevice(view.user_agent) : 'unknown',
            sessionDuration: session.averageSessionDuration
          };
        });

      // Set all the stats
      setStats({
        totalViews,
        uniqueUsers,
        authenticatedUsers,
        growthRate,
        averageViewsPerDay,
        peakHour,
        topPages,
        viewsByCountry,
        viewsByDevice,
        viewsByHour,
        viewsByDay,
        userRetention: retention,
        engagementMetrics: engagement,
        recentActivity
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6" dir={dir}>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold dark:text-white">{t('admin.analytics.title')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('admin.analytics.lastUpdated')}: {new Date().toLocaleString()}
          </p>
        </div>
        <select
          className="px-4 py-2 border rounded-lg dark:bg-gray-800 dark:text-white dark:border-gray-600"
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
        >
          <option value="24h">{t('admin.analytics.timeRange.24h')}</option>
          <option value="7d">{t('admin.analytics.timeRange.7d')}</option>
          <option value="30d">{t('admin.analytics.timeRange.30d')}</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('admin.analytics.totalViews')}</h3>
          <p className="text-3xl font-bold text-qatar-maroon">{stats.totalViews.toLocaleString()}</p>
          <div className="mt-2 flex items-center">
            <span className={`text-sm ${stats.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {stats.growthRate >= 0 ? '↑' : '↓'} {Math.abs(stats.growthRate).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('admin.analytics.uniqueUsers')}</h3>
          <p className="text-3xl font-bold text-qatar-maroon">{stats.uniqueUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('admin.analytics.avgViewsPerDay')}: {stats.averageViewsPerDay.toFixed(1)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('admin.analytics.authenticatedUsers')}</h3>
          <p className="text-3xl font-bold text-qatar-maroon">{stats.authenticatedUsers.toLocaleString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {((stats.authenticatedUsers / stats.uniqueUsers) * 100).toFixed(1)}% {t('admin.analytics.ofTotal')}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2 dark:text-white">{t('admin.analytics.peakHour')}</h3>
          <p className="text-3xl font-bold text-qatar-maroon">{stats.peakHour.hour}:00</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {stats.peakHour.views} {t('admin.analytics.views')}
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Pages Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.analytics.topPages')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topPages}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="pageType" />
                <YAxis />
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
                        <p className="font-semibold">{data.pageType}</p>
                        <p>{data.views.toLocaleString()} {t('admin.analytics.views')}</p>
                        <p className={data.trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {data.trend >= 0 ? '↑' : '↓'} {Math.abs(data.trend).toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
                <Bar dataKey="views" fill="#9F1239" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Views by Country Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.analytics.viewsByCountry')}</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.viewsByCountry}
                  dataKey="views"
                  nameKey="country"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.viewsByCountry.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white dark:bg-gray-800 p-3 rounded shadow">
                        <p className="font-semibold">{data.country.toUpperCase()}</p>
                        <p>{data.views.toLocaleString()} {t('admin.analytics.views')}</p>
                        <p className={data.trend >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {data.trend >= 0 ? '↑' : '↓'} {Math.abs(data.trend).toFixed(1)}%
                        </p>
                      </div>
                    );
                  }
                  return null;
                }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.analytics.userRetention')}</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.analytics.dailyRetention')}</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-qatar-maroon rounded-full h-2"
                    style={{ width: `${stats.userRetention.daily}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{stats.userRetention.daily.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.analytics.weeklyRetention')}</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-qatar-maroon rounded-full h-2"
                    style={{ width: `${stats.userRetention.weekly}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{stats.userRetention.weekly.toFixed(1)}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.analytics.monthlyRetention')}</p>
              <div className="flex items-center">
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-qatar-maroon rounded-full h-2"
                    style={{ width: `${stats.userRetention.monthly}%` }}
                  />
                </div>
                <span className="ml-2 text-sm font-medium">{stats.userRetention.monthly.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.analytics.engagement')}</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.analytics.avgSessionDuration')}</p>
              <p className="text-2xl font-bold text-qatar-maroon">
                {Math.floor(stats.engagementMetrics.averageSessionDuration / 60)}m {Math.floor(stats.engagementMetrics.averageSessionDuration % 60)}s
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.analytics.bounceRate')}</p>
              <p className="text-2xl font-bold text-qatar-maroon">{stats.engagementMetrics.bounceRate.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.analytics.pagesPerSession')}</p>
              <p className="text-2xl font-bold text-qatar-maroon">{stats.engagementMetrics.pagesPerSession.toFixed(1)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.analytics.deviceBreakdown')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.viewsByDevice}
                  dataKey="views"
                  nameKey="device"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {stats.viewsByDevice.map((entry, index) => (
                    <Cell key={`device-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4 dark:text-white">{t('admin.analytics.recentActivity')}</h3>
        <div className="flex justify-end mb-4 space-x-4">
          <button
            onClick={() => exportPageViews()}
            className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
          >
            {t('admin.analytics.exportPageViews')}
          </button>
          <button
            onClick={() => exportUserPageViews()}
            className="px-4 py-2 text-sm font-medium text-white bg-qatar-maroon hover:bg-qatar-maroon-dark rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qatar-maroon"
          >
            {t('admin.analytics.exportUserPageViews')}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.analytics.timestamp')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.analytics.pageType')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.analytics.country')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('admin.analytics.userType')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {stats.recentActivity.map((activity, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {new Date(activity.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {activity.pageType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                    {activity.countryCode.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {activity.isAuthenticated ? t('admin.analytics.authenticated') : t('admin.analytics.anonymous')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
