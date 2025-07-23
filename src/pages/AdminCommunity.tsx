import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useUserRoles, UserWithProfile } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Users, Search, UserCheck, UserMinus, Loader2, Shield, User, Edit, MapPin } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { EditUserDialog } from '@/components/EditUserDialog';
import { AdminMusicManagement } from '@/components/AdminMusicManagement';
import { supabase } from '@/integrations/supabase/client';

// Enhanced UserWithProfile interface to include location data
interface EnhancedUserWithProfile extends UserWithProfile {
  city?: string;
  state?: string;
  zip_code?: string;
}

const AdminCommunity = () => {
  const { isAdmin, loading: rolesLoading, updateUserRole, fetchAllUsers } = useUserRoles();
  const [users, setUsers] = useState<EnhancedUserWithProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<EnhancedUserWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<EnhancedUserWithProfile | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      
      // Set up real-time subscription for live updates
      const subscription = supabase
        .channel('admin-users-changes')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'por_eve_profiles' },
          () => {
            console.log('User profile changed, refreshing users...');
            fetchUsers();
          }
        )
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'user_roles' },
          () => {
            console.log('User roles changed, refreshing users...');
            fetchUsers();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [isAdmin]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Get all profiles with location data
      const { data: profiles, error: profilesError } = await supabase
        .from('por_eve_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine the data and map old 'user' roles to 'member'
      const usersWithRoles = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        city: profile.city,
        state: profile.state,
        zip_code: profile.zip_code,
        created_at: profile.created_at,
        roles: roles.filter(role => role.user_id === profile.id).map(role => ({
          ...role,
          role: role.role === 'user' ? 'member' as const : role.role as 'admin' | 'moderator' | 'member' | 'artist'
        }))
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch users',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => 
        user.roles.some(role => role.role === roleFilter)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId: string, role: 'admin' | 'moderator' | 'member' | 'artist', action: 'add' | 'remove') => {
    const result = await updateUserRole(userId, role, action);
    
    if (result.success) {
      toast({
        title: 'Success',
        description: `User role ${action === 'add' ? 'added' : 'removed'} successfully`,
      });
      fetchUsers(); // Refresh the users list
    } else {
      toast({
        title: 'Error',
        description: `Failed to ${action} role`,
        variant: 'destructive'
      });
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'destructive';
      case 'artist': return 'default';
      case 'moderator': return 'default';
      case 'member': return 'secondary';
      default: return 'outline';
    }
  };

  const hasRole = (user: EnhancedUserWithProfile, role: string) => {
    return user.roles.some(r => r.role === role);
  };

  const handleEditUser = (user: EnhancedUserWithProfile) => {
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleEditSuccess = () => {
    fetchUsers();
  };

  if (rolesLoading || !isAdmin) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
          <Header />
          <div className="flex justify-center items-center py-16">
            <div className="bg-white rounded-xl shadow-lg border border-emerald-100 p-12">
              <div className="flex items-center justify-center space-x-3">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                <p className="text-lg text-gray-600">
                  {!isAdmin ? 'Access denied. Admin privileges required.' : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-orange-50">
        <Header />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center">
                  <Users className="h-8 w-8 mr-3 text-emerald-600" />
                  Manage Community
                </h1>
                <p className="text-gray-600">Manage community member accounts and permissions</p>
              </div>
              <div className="flex items-center gap-4">
                <AdminMusicManagement />
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by email or name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="moderator">Moderator</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="artist">Artist</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {user.full_name || 'No name provided'}
                          </h3>
                          <p className="text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">
                            Joined: {new Date(user.created_at).toLocaleDateString()}
                          </p>
                          
                          {/* Location Information for Artists */}
                          {hasRole(user, 'artist') && (user.city || user.state || user.zip_code) && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span>
                                {[user.city, user.state, user.zip_code].filter(Boolean).join(', ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-4">
                        {/* Current Roles */}
                        <div className="flex flex-wrap gap-2 justify-end">
                          {user.roles.length === 0 ? (
                            <Badge variant="outline">No roles</Badge>
                          ) : (
                            user.roles.map((role) => (
                              <Badge 
                                key={role.id} 
                                variant={getRoleBadgeColor(role.role)}
                                className="flex items-center gap-1"
                              >
                                {role.role === 'admin' && <Shield className="h-3 w-3" />}
                                {role.role}
                              </Badge>
                            ))
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                          {/* Action Buttons */}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>

                          {/* Role Management Buttons */}
                          {!hasRole(user, 'admin') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'admin', 'add')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Make Admin
                            </Button>
                          )}
                          
                          {hasRole(user, 'admin') && user.email !== 'tyronenorris@gmail.com' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'admin', 'remove')}
                              className="text-gray-600 border-gray-200 hover:bg-gray-50"
                            >
                              <UserMinus className="h-4 w-4 mr-1" />
                              Remove Admin
                            </Button>
                          )}

                          {!hasRole(user, 'artist') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'artist', 'add')}
                              className="text-purple-600 border-purple-200 hover:bg-purple-50"
                            >
                              Make Artist
                            </Button>
                          )}
                          
                          {hasRole(user, 'artist') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'artist', 'remove')}
                              className="text-gray-600 border-gray-200 hover:bg-gray-50"
                            >
                              Remove Artist
                            </Button>
                          )}

                          {!hasRole(user, 'moderator') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'moderator', 'add')}
                            >
                              Make Moderator
                            </Button>
                          )}
                          
                          {hasRole(user, 'moderator') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRoleChange(user.id, 'moderator', 'remove')}
                            >
                              Remove Moderator
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredUsers.length === 0 && (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No users found</h3>
                    <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
        
        <Footer />
      </div>

      <EditUserDialog
        user={editingUser}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
      />
    </ProtectedRoute>
  );
};

export default AdminCommunity;