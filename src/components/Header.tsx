
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Plus, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
                      <span className="hidden sm:inline">Account</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link to="/my-events" className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4" />
                        My Events
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
