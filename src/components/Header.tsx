
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, User, LogOut, CheckCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';

export const Header = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-emerald-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center space-x-2 text-2xl font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <Calendar className="h-8 w-8" />
            <span>Portland Events</span>
          </Link>
          
          {/* Navigation Menu */}
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    to="/events" 
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Events
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    to="/venues" 
                    className="group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Venues
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Button 
                  asChild 
                  variant="outline" 
                  className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                >
                  <Link to="/submit-event" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Submit Event</span>
                  </Link>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{user?.email || 'Account'}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/my-events" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        My Events
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/approve-events" className="flex items-center">
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Approve Events
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                asChild 
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
