import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import CampaignDetailPage from "@/pages/campaign-detail-page";
import MyCampaignsPage from "@/pages/my-campaigns-page";
import AdvertiserDashboard from "@/pages/advertiser-dashboard";
import { ProtectedRoute } from "./lib/protected-route";
import { useAuth } from "./hooks/use-auth";

function Router() {
  const { user } = useAuth();
  
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/campaigns/:id">
        {(params) => <CampaignDetailPage id={params.id} />}
      </Route>
      
      {/* 인플루언서 전용 페이지 */}
      <ProtectedRoute
        path="/my-campaigns"
        component={MyCampaignsPage}
        roleRequired="influencer"
      />
      
      {/* 광고주 전용 페이지 */}
      <ProtectedRoute
        path="/dashboard"
        component={AdvertiserDashboard}
        roleRequired="advertiser"
      />
      
      {/* 404 페이지 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <TooltipProvider>
      <Toaster />
      <Router />
    </TooltipProvider>
  );
}

export default App;
