import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Ship,
  Calendar,
  Star,
  MapPin,
  Music,
  DollarSign,
  Activity,
  Eye,
  Heart,
  Download,
  RefreshCw,
  Filter,
  ChevronDown,
} from 'lucide-react';

// Ocean theme colors matching the design system
const OCEAN_COLORS = {
  primary: 'hsl(206, 85%, 41%)',
  secondary: 'hsl(175, 60%, 45%)',
  accent: 'hsl(45, 86%, 58%)',
  coral: 'hsl(14, 89%, 65%)',
  purple: 'hsl(280, 65%, 55%)',
  success: 'hsl(159, 100%, 36%)',
  warning: 'hsl(42, 92%, 56%)',
  danger: 'hsl(356, 90%, 54%)',
};

const CHART_COLORS = [
  OCEAN_COLORS.primary,
  OCEAN_COLORS.secondary,
  OCEAN_COLORS.accent,
  OCEAN_COLORS.coral,
  OCEAN_COLORS.purple,
  OCEAN_COLORS.success,
  OCEAN_COLORS.warning,
  OCEAN_COLORS.danger,
];

interface AnalyticsData {
  tripEngagement: Array<{
    month: string;
    views: number;
    bookings: number;
    engagement: number;
  }>;
  portPopularity: Array<{
    name: string;
    visits: number;
    rating: number;
    country: string;
  }>;
  revenueAnalytics: Array<{
    month: string;
    revenue: number;
    bookings: number;
    averageBookingValue: number;
  }>;
  talentPerformance: Array<{
    name: string;
    category: string;
    performances: number;
    rating: number;
  }>;
  realTimeStats: {
    totalTrips: number;
    activeUsers: number;
    totalRevenue: number;
    conversionRate: number;
    totalViews: number;
    totalBookings: number;
  };
}

// Mock data generator - replace with actual API calls
const generateMockData = (): AnalyticsData => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return {
    tripEngagement: months.map((month) => ({
      month,
      views: Math.floor(Math.random() * 5000) + 1000,
      bookings: Math.floor(Math.random() * 300) + 50,
      engagement: Math.floor(Math.random() * 100) + 20,
    })),
    portPopularity: [
      { name: 'Santorini', visits: 12450, rating: 4.8, country: 'Greece' },
      { name: 'Mykonos', visits: 11230, rating: 4.7, country: 'Greece' },
      { name: 'Istanbul', visits: 9840, rating: 4.6, country: 'Turkey' },
      { name: 'Kusadasi', visits: 8920, rating: 4.5, country: 'Turkey' },
      { name: 'Athens', visits: 8100, rating: 4.4, country: 'Greece' },
      { name: 'Alexandria', visits: 6890, rating: 4.3, country: 'Egypt' },
      { name: 'Iraklion', visits: 5670, rating: 4.2, country: 'Greece' },
    ],
    revenueAnalytics: months.map((month) => ({
      month,
      revenue: Math.floor(Math.random() * 500000) + 100000,
      bookings: Math.floor(Math.random() * 200) + 50,
      averageBookingValue: Math.floor(Math.random() * 3000) + 1500,
    })),
    talentPerformance: [
      { name: 'Trixie Mattel', category: 'Drag', performances: 24, rating: 4.9 },
      { name: 'Bianca Del Rio', category: 'Comedy', performances: 18, rating: 4.8 },
      { name: 'Peppermint', category: 'Music', performances: 22, rating: 4.7 },
      { name: 'Bob the Drag Queen', category: 'Comedy', performances: 16, rating: 4.6 },
      { name: 'Shangela', category: 'Entertainment', performances: 20, rating: 4.5 },
    ],
    realTimeStats: {
      totalTrips: 24,
      activeUsers: 1847,
      totalRevenue: 2450000,
      conversionRate: 8.4,
      totalViews: 45620,
      totalBookings: 3840,
    },
  };
};

const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  suffix?: string;
  description?: string;
  color?: string;
}> = ({ title, value, icon: Icon, trend, suffix = '', description, color = OCEAN_COLORS.primary }) => (
  <Card className="hover:shadow-lg transition-all duration-300">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center`} style={{ backgroundColor: `${color}15` }}>
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
        {trend !== undefined && (
          <Badge variant={trend > 0 ? "default" : "destructive"} className="text-xs">
            {trend > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}%
          </Badge>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">
          {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </h3>
        <p className="text-sm text-gray-600 mt-1">{title}</p>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
    </CardContent>
  </Card>
);

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [timeRange, setTimeRange] = useState('12m');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // In a real implementation, this would fetch from your API
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['analytics', timeRange, selectedCategory],
    queryFn: () => generateMockData(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-500">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Real-time insights and performance metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="12m">Last Year</option>
          </select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Real-time Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Trips"
          value={analyticsData.realTimeStats.totalTrips}
          icon={Ship}
          trend={12}
          color={OCEAN_COLORS.primary}
        />
        <StatCard
          title="Active Users"
          value={analyticsData.realTimeStats.activeUsers}
          icon={Users}
          trend={8}
          color={OCEAN_COLORS.secondary}
        />
        <StatCard
          title="Total Revenue"
          value={`$${(analyticsData.realTimeStats.totalRevenue / 1000000).toFixed(1)}M`}
          icon={DollarSign}
          trend={15}
          color={OCEAN_COLORS.success}
        />
        <StatCard
          title="Conversion Rate"
          value={analyticsData.realTimeStats.conversionRate}
          icon={TrendingUp}
          trend={-2}
          suffix="%"
          color={OCEAN_COLORS.accent}
        />
        <StatCard
          title="Total Views"
          value={`${(analyticsData.realTimeStats.totalViews / 1000).toFixed(0)}K`}
          icon={Eye}
          trend={22}
          color={OCEAN_COLORS.coral}
        />
        <StatCard
          title="Total Bookings"
          value={analyticsData.realTimeStats.totalBookings}
          icon={Calendar}
          trend={18}
          color={OCEAN_COLORS.purple}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trip Engagement Line Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Trip Engagement Trends
            </CardTitle>
            <CardDescription>
              Monthly views, bookings, and engagement rates across all trips
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analyticsData.tripEngagement}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="views"
                  stroke={OCEAN_COLORS.primary}
                  strokeWidth={3}
                  dot={{ fill: OCEAN_COLORS.primary, strokeWidth: 2, r: 4 }}
                  name="Views"
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  stroke={OCEAN_COLORS.secondary}
                  strokeWidth={3}
                  dot={{ fill: OCEAN_COLORS.secondary, strokeWidth: 2, r: 4 }}
                  name="Bookings"
                />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke={OCEAN_COLORS.accent}
                  strokeWidth={3}
                  dot={{ fill: OCEAN_COLORS.accent, strokeWidth: 2, r: 4 }}
                  name="Engagement %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Port Popularity Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-green-600" />
              Port Popularity
            </CardTitle>
            <CardDescription>
              Most visited destinations by traveler interest
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analyticsData.portPopularity} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" stroke="#6b7280" />
                <YAxis dataKey="name" type="category" stroke="#6b7280" width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="visits"
                  fill={OCEAN_COLORS.secondary}
                  radius={[0, 4, 4, 0]}
                  name="Visits"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Analytics Area Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Revenue Analytics
            </CardTitle>
            <CardDescription>
              Monthly revenue trends and booking performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={analyticsData.revenueAnalytics}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke={OCEAN_COLORS.success}
                  fill={OCEAN_COLORS.success}
                  fillOpacity={0.3}
                  name="Revenue ($)"
                />
                <Area
                  type="monotone"
                  dataKey="averageBookingValue"
                  stackId="2"
                  stroke={OCEAN_COLORS.accent}
                  fill={OCEAN_COLORS.accent}
                  fillOpacity={0.3}
                  name="Avg Booking Value ($)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Talent Performance and Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Talent Performance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5 text-purple-600" />
              Talent Performance
            </CardTitle>
            <CardDescription>
              Top performers by show count and ratings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.talentPerformance}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="performances"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {analyticsData.talentPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {analyticsData.talentPerformance.map((talent, index) => (
                <div key={talent.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="font-medium">{talent.name}</span>
                    <Badge variant="outline" className="text-xs">{talent.category}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{talent.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics Radial Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Key performance indicators at a glance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="90%" data={[
                { name: 'Conversion Rate', value: analyticsData.realTimeStats.conversionRate, fill: OCEAN_COLORS.primary },
                { name: 'User Satisfaction', value: 92, fill: OCEAN_COLORS.secondary },
                { name: 'Booking Completion', value: 87, fill: OCEAN_COLORS.accent },
                { name: 'Return Rate', value: 78, fill: OCEAN_COLORS.coral },
              ]}>
                <RadialBar dataKey="value" cornerRadius={10} />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">92%</div>
                <div className="text-sm text-gray-600">User Satisfaction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">87%</div>
                <div className="text-sm text-gray-600">Booking Completion</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">78%</div>
                <div className="text-sm text-gray-600">Return Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{analyticsData.realTimeStats.conversionRate}%</div>
                <div className="text-sm text-gray-600">Conversion</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Performance Insights
            </CardTitle>
            <CardDescription>
              AI-generated insights based on your data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Engagement Spike Detected</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Santorini shows 25% higher engagement than other destinations. Consider featuring more Greek island content.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-green-900">High Performance Talent</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Trixie Mattel consistently receives 4.9+ ratings. Book for upcoming premium voyages.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Seasonal Opportunity</h4>
                  <p className="text-sm text-orange-700 mt-1">
                    Summer bookings show 40% higher conversion rates. Optimize marketing for Q2/Q3.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Top Rated Content
            </CardTitle>
            <CardDescription>
              Highest rated trips and experiences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Greek Isles Drag Cruise', rating: 4.9, type: 'Trip' },
              { name: 'Trixie & Katya Show', rating: 4.8, type: 'Event' },
              { name: 'Santorini Sunset Party', rating: 4.7, type: 'Party' },
              { name: 'Istanbul Cultural Tour', rating: 4.6, type: 'Excursion' },
              { name: 'Comedy Night', rating: 4.5, type: 'Event' },
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.type}</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-medium">{item.rating}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}