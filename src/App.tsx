import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { POSInterface } from "@/components/POS/POSInterface";
import { CartView } from "./pages/CartView";
import { ReportsPage } from "./pages/ReportsPage";
import { StoreSettings } from "./pages/StoreSettings";
import { Dashboard } from "./pages/Dashboard";
import { BackupRestorePage } from "./pages/BackupRestorePage";
import NotFound from "./pages/NotFound";
import { POSProvider } from "@/contexts/POSContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { BluetoothProvider } from "@/contexts/BluetoothContext";
import { LoginPage } from "@/components/Auth/LoginPage";
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute";
import { AdminRoute } from "@/components/Auth/AdminRoute";
import { UserManagement } from "@/components/Admin/UserManagement";
import { WaitingApproval } from "@/pages/WaitingApproval";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PPOB } from "@/pages/PPOB";
import { SubscriptionManagement } from "@/pages/admin/SubscriptionManagement";
import { PPOBNavButton } from "@/components/Navigation/PPOBNavButton";

// Create QueryClient outside component to prevent recreation on every render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
    },
  },
});

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StoreProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <POSProvider>
                <BluetoothProvider>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/pos" element={
                      <ProtectedRoute>
                        <POSInterface />
                      </ProtectedRoute>
                    } />
                    <Route path="/ppob" element={
                      <ProtectedRoute>
                        <PPOB />
                      </ProtectedRoute>
                    } />
                    <Route path="/cart" element={
                      <ProtectedRoute>
                        <CartView />
                      </ProtectedRoute>
                    } />
                    <Route path="/reports" element={
                      <ProtectedRoute>
                        <ReportsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <StoreSettings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/users" element={
                      <AdminRoute>
                        <UserManagement />
                      </AdminRoute>
                    } />
                    <Route path="/admin/subscriptions" element={
                      <AdminRoute>
                        <SubscriptionManagement />
                      </AdminRoute>
                    } />
                    <Route path="/backup-restore" element={
                      <AdminRoute>
                        <BackupRestorePage />
                      </AdminRoute>
                    } />
                    <Route path="/waiting-approval" element={<WaitingApproval />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <PPOBNavButton />
                </BluetoothProvider>
              </POSProvider>
            </BrowserRouter>
          </StoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
