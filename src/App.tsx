
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SubmitEvent from "./pages/SubmitEvent";
import MyEvents from "./pages/MyEvents";
import ManageEvents from "./pages/ManageEvents";
import Auth from "./pages/Auth";
import Event from "./pages/Event";
import Events from "./pages/Events";
import Venues from "./pages/Venues";
import Venue from "./pages/Venue";
import Users from "./pages/Users";
import User from "./pages/User";
import Account from "./pages/Account";
import AdminCommunity from "./pages/AdminCommunity";
import AdminVenues from "./pages/AdminVenues";
import EditVenue from "./pages/EditVenue";
import Music from "./pages/Music";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/events" element={<Events />} />
            <Route path="/event/:eventSlug" element={<Event />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venue/:venueSlug" element={<Venue />} />
            <Route path="/users" element={<Users />} />
            <Route path="/user/:userSlug" element={<User />} />
            <Route path="/account" element={<Account />} />
            <Route path="/submit-event" element={<SubmitEvent />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/approve-events" element={<ManageEvents />} />
            <Route path="/manage-events" element={<ManageEvents />} />
            <Route path="/admin/events" element={<AdminProtectedRoute><ManageEvents /></AdminProtectedRoute>} />
            <Route path="/admin/users" element={<AdminProtectedRoute><AdminCommunity /></AdminProtectedRoute>} />
            <Route path="/admin/venues" element={<AdminProtectedRoute><AdminVenues /></AdminProtectedRoute>} />
            <Route path="/admin/venues/:venueId" element={<AdminProtectedRoute><EditVenue /></AdminProtectedRoute>} />
            <Route path="/music" element={<Music />} />
            <Route path="/auth" element={<Auth />} />
            {/* Legacy route redirects for SEO */}
            <Route path="/event/:eventId" element={<Event />} />
            <Route path="/venue/:venueName" element={<Venue />} />
            <Route path="/user/:userId" element={<User />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
