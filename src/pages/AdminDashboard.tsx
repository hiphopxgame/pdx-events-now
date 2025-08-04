import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Video, 
  TrendingUp, 
  Eye, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Settings,
  Shield,
  Building2,
  Music
} from 'lucide-react';
import AdminProtectedRoute from '@/components/AdminProtectedRoute';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import SpreadsheetEventImporter from '@/components/SpreadsheetEventImporter';
import ImportManager from '@/components/ImportManager';

interface DashboardStats {
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
  totalVenues: number;
  pendingVenues: number;
  totalUsers: number;
  totalArtistApplications: number;
  pendingArtistApplications: number;
  totalContent: number;
  pendingContent: number;
}

const AdminDashboard = () => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  const { isAdmin, loading: rolesLoading } = useUserRoles();
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    pendingEvents: 0,
    approvedEvents: 0,
    totalVenues: 0,
    pendingVenues: 0,
    totalUsers: 0,
    totalArtistApplications: 0,
    pendingArtistApplications: 0,
    totalContent: 0,
    pendingContent: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Fetch events stats
      const { data: eventsData } = await supabase
        .from('user_events')
        .select('status');
      
      // Fetch venues stats
      const { data: venuesData } = await supabase
        .from('venues')
        .select('status');
      
      // Fetch users stats
      const { data: usersData } = await supabase
        .from('por_eve_profiles')
        .select('id');
      
      // Fetch artist applications stats
      const { data: artistApplicationsData } = await supabase
        .from('artist_applications')
        .select('status');
      
      // Fetch content stats
      const { data: contentData } = await supabase
        .from('artist_content')
        .select('status');

      const eventStats = eventsData?.reduce((acc, event) => {
        acc.total++;
        if (event.status === 'pending') acc.pending++;
        if (event.status === 'approved') acc.approved++;
        return acc;
      }, { total: 0, pending: 0, approved: 0 }) || { total: 0, pending: 0, approved: 0 };

      const venueStats = venuesData?.reduce((acc, venue) => {
        acc.total++;
        if (venue.status === 'pending') acc.pending++;
        return acc;
      }, { total: 0, pending: 0 }) || { total: 0, pending: 0 };

      const artistAppStats = artistApplicationsData?.reduce((acc, app) => {
        acc.total++;
        if (app.status === 'pending') acc.pending++;
        return acc;
      }, { total: 0, pending: 0 }) || { total: 0, pending: 0 };

      const contentStats = contentData?.reduce((acc, content) => {
        acc.total++;
        if (content.status === 'pending') acc.pending++;
        return acc;
      }, { total: 0, pending: 0 }) || { total: 0, pending: 0 };

      setStats({
        totalEvents: eventStats.total,
        pendingEvents: eventStats.pending,
        approvedEvents: eventStats.approved,
        totalVenues: venueStats.total,
        pendingVenues: venueStats.pending,
        totalUsers: usersData?.length || 0,
        totalArtistApplications: artistAppStats.total,
        pendingArtistApplications: artistAppStats.pending,
        totalContent: contentStats.total,
        pendingContent: contentStats.pending,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (rolesLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
          <div className="flex items-center justify-center space-x-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
            <p className="text-lg text-gray-600">
              {!isAdmin ? 'Access denied. Admin privileges required.' : 'Loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Create Event",
      description: "Create events with auto-import functionality",
      icon: Calendar,
      path: "/admin/create-event",
      badge: "NEW",
      badgeVariant: "secondary" as const
    },
    {
      title: "Manage Events",
      description: "Review and approve submitted events",
      icon: Calendar,
      path: "/manage-events",
      badge: stats.pendingEvents > 0 ? stats.pendingEvents : null,
      badgeVariant: "destructive" as const
    },
    {
      title: "Manage Venues",
      description: "Review and approve venue submissions",
      icon: Building2,
      path: "/admin/venues",
      badge: stats.pendingVenues > 0 ? stats.pendingVenues : null,
      badgeVariant: "destructive" as const
    },
    {
      title: "Manage Community",
      description: "User roles and artist applications",
      icon: Users,
      path: "/admin/users",
      badge: stats.pendingArtistApplications > 0 ? stats.pendingArtistApplications : null,
      badgeVariant: "destructive" as const
    },
    {
      title: "Manage Media",
      description: "Review and approve content submissions",
      icon: Video,
      path: "/manage-content",
      badge: stats.pendingContent > 0 ? stats.pendingContent : null,
      badgeVariant: "destructive" as const
    },
    {
      title: "Featured Artists",
      description: "Manage featured artists showcase",
      icon: Music,
      path: "/admin/artists",
      badge: null,
      badgeVariant: "secondary" as const
    }
  ];

  const statCards = [
    {
      title: "Total Events",
      value: stats.totalEvents,
      change: stats.pendingEvents > 0 ? `${stats.pendingEvents} pending` : "All up to date",
      icon: Calendar,
      trend: "up"
    },
    {
      title: "Total Venues",
      value: stats.totalVenues,
      change: stats.pendingVenues > 0 ? `${stats.pendingVenues} pending` : "All up to date",
      icon: MapPin,
      trend: "up"
    },
    {
      title: "Community Members",
      value: stats.totalUsers,
      change: "Active users",
      icon: Users,
      trend: "up"
    },
    {
      title: "Content Items",
      value: stats.totalContent,
      change: stats.pendingContent > 0 ? `${stats.pendingContent} pending` : "All reviewed",
      icon: Video,
      trend: "up"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and monitor Portland.Events platform
              </p>
            </div>
            <Button 
              onClick={fetchDashboardStats}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Refresh Stats
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index} className="bg-white shadow-lg border-l-4 border-l-primary">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action, index) => (
              <Card 
                key={index} 
                className="bg-white shadow-lg hover:shadow-xl transition-shadow cursor-pointer group border-emerald-100"
                onClick={() => navigate(action.path)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <action.icon className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors" />
                    {action.badge && (
                      <Badge variant={action.badgeVariant} className="animate-pulse">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                    {action.title}
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    {action.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Import Management */}
        <div className="mb-8">
          <ImportManager key={refreshKey} onRefresh={handleRefresh} />
        </div>

        {/* Events Importer */}
        <div className="mb-8">
          <SpreadsheetEventImporter onImportSubmitted={handleRefresh} />
        </div>

        {/* Recent Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Pending Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.pendingEvents > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Events awaiting approval</span>
                    </div>
                    <Badge variant="destructive">{stats.pendingEvents}</Badge>
                  </div>
                )}
                {stats.pendingVenues > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Venues awaiting approval</span>
                    </div>
                    <Badge variant="destructive">{stats.pendingVenues}</Badge>
                  </div>
                )}
                {stats.pendingArtistApplications > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Music className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Artist applications</span>
                    </div>
                    <Badge variant="destructive">{stats.pendingArtistApplications}</Badge>
                  </div>
                )}
                {stats.pendingContent > 0 && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="h-5 w-5 text-orange-600" />
                      <span className="font-medium">Content awaiting review</span>
                    </div>
                    <Badge variant="destructive">{stats.pendingContent}</Badge>
                  </div>
                )}
                {stats.pendingEvents === 0 && 
                 stats.pendingVenues === 0 && 
                 stats.pendingArtistApplications === 0 && 
                 stats.pendingContent === 0 && (
                  <div className="flex items-center justify-center p-6 text-gray-500">
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>All caught up! No pending reviews.</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Platform Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Approved Events</span>
                  <span className="font-semibold text-green-600">{stats.approvedEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Venues</span>
                  <span className="font-semibold">{stats.totalVenues}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Community Members</span>
                  <span className="font-semibold">{stats.totalUsers}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Artist Applications</span>
                  <span className="font-semibold">{stats.totalArtistApplications}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Content Items</span>
                  <span className="font-semibold">{stats.totalContent}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AdminDashboard;