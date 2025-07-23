import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member' | 'artist';
  created_at: string;
  updated_at: string;
}

export interface UserWithProfile {
  id: string;
  email: string;
  full_name?: string;
  roles: UserRole[];
  created_at: string;
}

export const useUserRoles = () => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
      fetchUserRoles();
    } else {
      setIsAdmin(false);
      setUserRoles([]);
      setLoading(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUserRoles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user?.id);
      
      if (error) throw error;
      // Filter out any old 'user' roles and map them to 'member'
      const mappedRoles = (data || []).map(role => ({
        ...role,
        role: role.role === 'user' ? 'member' as const : role.role as 'admin' | 'moderator' | 'member' | 'artist'
      }));
      setUserRoles(mappedRoles);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async (): Promise<UserWithProfile[]> => {
    try {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('por_eve_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Then get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine the data and map old 'user' roles to 'member'
      const usersWithRoles = profiles.map(profile => ({
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        created_at: profile.created_at,
        roles: roles.filter(role => role.user_id === profile.id).map(role => ({
          ...role,
          role: role.role === 'user' ? 'member' as const : role.role as 'admin' | 'moderator' | 'member' | 'artist'
        }))
      }));

      return usersWithRoles;
    } catch (error) {
      console.error('Error fetching all users:', error);
      return [];
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'moderator' | 'member' | 'artist', action: 'add' | 'remove') => {
    try {
      if (action === 'add') {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);
        if (error) throw error;
      }
      return { success: true };
    } catch (error) {
      console.error('Error updating user role:', error);
      return { success: false, error };
    }
  };

  const upgradeToArtist = async () => {
    try {
      const { error } = await supabase.rpc('upgrade_to_artist');
      if (error) throw error;
      
      // Refresh user roles after upgrade
      await fetchUserRoles();
    } catch (error) {
      console.error('Error upgrading to artist:', error);
      throw error;
    }
  };

  const hasRole = (role: 'admin' | 'moderator' | 'member' | 'artist') => {
    return userRoles.some(userRole => userRole.role === role);
  };

  return {
    isAdmin,
    userRoles,
    loading,
    fetchAllUsers,
    updateUserRole,
    upgradeToArtist,
    hasRole,
    checkAdminStatus
  };
};