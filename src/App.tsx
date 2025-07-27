
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
import AdminUsers from "./pages/AdminUsers";
import AdminVenues from "./pages/AdminVenues";
import AdminDashboard from "./pages/AdminDashboard";
import EditVenue from "./pages/EditVenue";
import ManageContent from "./pages/ManageContent";
import Content from "./pages/Content";
import MapTest from "./pages/MapTest";
import AdminProtectedRoute from "./components/AdminProtectedRoute";
import NotFound from "./pages/NotFound";
import ManageImports from "./pages/ManageImports";
import AdminCreateEvent from "./pages/AdminCreateEvent";

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
            <Route path="/events/:eventSlug" element={<Event />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venue/:venueName" element={<Venue />} />
            <Route path="/community" element={<Users />} />
            <Route path="/community/:userSlug" element={<User />} />
            <Route path="/media" element={<Content />} />
            <Route path="/media/:mediaSlug" element={<Content />} />
            <Route path="/account" element={<Account />} />
            <Route path="/submit-event" element={<SubmitEvent />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/approve-events" element={<ManageEvents />} />
            <Route path="/manage-events" element={<ManageEvents />} />
            <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/create-event" element={<AdminProtectedRoute><AdminCreateEvent /></AdminProtectedRoute>} />
            <Route path="/admin/events" element={<AdminProtectedRoute><ManageEvents /></AdminProtectedRoute>} />
            <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
            <Route path="/admin/venues" element={<AdminProtectedRoute><AdminVenues /></AdminProtectedRoute>} />
            <Route path="/admin/venues/:venueId" element={<AdminProtectedRoute><EditVenue /></AdminProtectedRoute>} />
            <Route path="/admin/imports" element={<AdminProtectedRoute><ManageImports /></AdminProtectedRoute>} />
            <Route path="/manage-content" element={<AdminProtectedRoute><ManageContent /></AdminProtectedRoute>} />
            <Route path="/map-test" element={<MapTest />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
