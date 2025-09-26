import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  Ship,
  Calendar,
  TrendingUp,
  Activity,
  Plus,
  Clock,
  Star
} from 'lucide-react';

// This is a simplified version of AdminDashboard without its own sidebar
// For use with AdminLayout
export default function AdminDashboardContent() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6 shadow-lg backdrop-blur">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Dashboard Overview</h1>
            <p className="text-sm text-white/60">Welcome back! Here's what's happening with your trips.</p>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
            <div>
              <h3 className="text-sm font-medium text-white/80">Active Trips</h3>
              <div className="text-2xl font-bold text-white">2</div>
              <p className="text-xs text-[#34d399]">+12% from last month</p>
            </div>
            <Ship className="h-8 w-8 text-[#22d3ee]/60" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
            <div>
              <h3 className="text-sm font-medium text-white/80">Talent Profiles</h3>
              <div className="text-2xl font-bold text-white">156</div>
              <p className="text-xs text-[#34d399]">+23% from last month</p>
            </div>
            <Users className="h-8 w-8 text-[#22d3ee]/60" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
            <div>
              <h3 className="text-sm font-medium text-white/80">Engagement Rate</h3>
              <div className="text-2xl font-bold text-white">87%</div>
              <p className="text-xs text-[#fb7185]">-5% from last month</p>
            </div>
            <TrendingUp className="h-8 w-8 text-[#22d3ee]/60" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <div className="flex flex-row items-center justify-between space-y-0 px-6 py-4">
            <div>
              <h3 className="text-sm font-medium text-white/80">Upcoming Events</h3>
              <div className="text-2xl font-bold text-white">3</div>
              <p className="text-xs text-white/60">Today</p>
            </div>
            <Calendar className="h-8 w-8 text-[#22d3ee]/60" />
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <header className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent Activity
            </h2>
          </header>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#34d399] rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">New trip created</p>
                <p className="text-xs text-white/60">Greek Isles 2025 - 2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#22d3ee] rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Talent profile updated</p>
                <p className="text-xs text-white/60">Trixie Mattel - 15 minutes ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#a855f7] rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">Event published</p>
                <p className="text-xs text-white/60">Welcome Party - 1 hour ago</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#fbbf24] rounded-full"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">New review received</p>
                <p className="text-xs text-white/60">5-star rating - 2 hours ago</p>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <header className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Quick Actions
            </h2>
          </header>
          <div className="p-6 grid grid-cols-2 gap-3">
            <Button variant="ghost" className="justify-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10">
              <Plus className="w-4 h-4 mr-2" />
              Create New Trip
            </Button>
            <Button variant="ghost" className="justify-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10">
              <Users className="w-4 h-4 mr-2" />
              Add Talent
            </Button>
            <Button variant="ghost" className="justify-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10">
              <Calendar className="w-4 h-4 mr-2" />
              Schedule Event
            </Button>
            <Button variant="ghost" className="justify-start rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/80 hover:bg-white/10">
              <Ship className="w-4 h-4 mr-2" />
              Add Port
            </Button>
          </div>
        </section>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <header className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Trip Engagement Trends</h2>
          </header>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center text-white/60">
              Chart visualization would go here
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#10192f]/80 shadow-2xl shadow-black/40 backdrop-blur">
          <header className="border-b border-white/10 px-6 py-4">
            <h2 className="text-lg font-semibold text-white">Popular Destinations</h2>
          </header>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center text-white/60">
              Chart visualization would go here
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}