
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SubmitEvent from "./pages/SubmitEvent";
import MyEvents from "./pages/MyEvents";
import ApproveEvents from "./pages/ApproveEvents";
import Auth from "./pages/Auth";
import Event from "./pages/Event";
import Events from "./pages/Events";
import Venues from "./pages/Venues";
import Venue from "./pages/Venue";
import AdminUsers from "./pages/AdminUsers";
import AdminVenues from "./pages/AdminVenues";
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
            <Route path="/event/:eventId" element={<Event />} />
            <Route path="/venues" element={<Venues />} />
            <Route path="/venue/:venueName" element={<Venue />} />
            <Route path="/submit-event" element={<SubmitEvent />} />
            <Route path="/my-events" element={<MyEvents />} />
            <Route path="/approve-events" element={<ApproveEvents />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/venues" element={<AdminVenues />} />
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
