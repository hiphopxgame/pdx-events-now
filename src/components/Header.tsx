
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, User, LogOut, CheckCircle, MapPin, Shield, Users, Building2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const Header = () => {
  const { user, signOut } = useAuth();
  const { isAdmin } = useUserRoles();
  const navigate = useNavigate();

  const handleNavClick = (path: string, event?: React.MouseEvent) => {
    console.log('Navigation clicked:', path);
    event?.preventDefault();
    event?.stopPropagation();
    
    try {
      console.log('Navigating to:', path);
      navigate(path);
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-brand-white/95 backdrop-blur-sm shadow-sm border-b border-primary/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold text-primary hover:text-primary/80 transition-colors"
          >
            <Calendar className="h-8 w-8" />
            <span>Portland Events</span>
          </Link>
          
          <nav className="hidden md:flex space-x-1">
            <button 
              onClick={(e) => handleNavClick('/events', e)}
              className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Events
            </button>
            <button 
              onClick={(e) => handleNavClick('/venues', e)}
              className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Venues
            </button>
            {user && (
              <button 
                onClick={(e) => handleNavClick('/users', e)}
                className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none cursor-pointer"
              >
                <Users className="h-4 w-4 mr-2" />
                Users
              </button>
            )}
          </nav>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button 
                  onClick={(e) => handleNavClick('/submit-event', e)}
                  variant="outline" 
                  className="border-primary/30 text-primary hover:bg-accent cursor-pointer"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  <span>Submit Event</span>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user?.email || 'Account'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="z-50 bg-background">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/my-events" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        My Events
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild>
                        <Link to="/manage-events" className="flex items-center">
                          <Settings className="mr-2 h-4 w-4" />
                          Manage Events
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/users" className="flex items-center">
                            <Users className="mr-2 h-4 w-4" />
                            Manage Users
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/admin/venues" className="flex items-center">
                            <Building2 className="mr-2 h-4 w-4" />
                            Manage Venues
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                onClick={(e) => handleNavClick('/auth', e)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
