
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CarsPage } from './pages/CarsPage';
import { SparePartsPage } from './pages/SparePartsPage';
import { SparePartDetailsPage } from './pages/SparePartDetailsPage';
import { DealershipsPage } from './pages/DealershipsPage';
import { CarDetailsPage } from './pages/CarDetailsPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { MyAdsPage } from './pages/MyAdsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SellCarPage } from './pages/SellCarPage';
import { ServicesPage } from './pages/ServicesPage';
import { CarRentalPage } from './pages/CarRentalPage';
import { PageTracker } from './components/PageTracker';
import { ShowroomDetailsPage } from './pages/ShowroomDetailsPage';
import { RootRedirect } from './components/RootRedirect';
import { ContactPage } from './pages/ContactPage';
import { RegisterShowroomPage } from './pages/RegisterShowroomPage';
import { DealerDashboard } from './pages/dealer/DealerDashboard';

// Admin Imports
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminCarsPage } from './pages/admin/AdminCarsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminDealersPage } from './pages/admin/AdminDealersPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AdminContentPage } from './pages/admin/AdminContentPage';
import { AdminBrandsPage } from './pages/admin/AdminBrandsPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <PageTracker />
          <Routes>
            {/* Root Redirect Logic */}
            <Route path="/" element={<RootRedirect />} />

            {/* Country Specific Routes */}
            <Route path="/:countryCode" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="cars" element={<CarsPage />} />
              <Route path="cars/:id" element={<CarDetailsPage />} />
              <Route path="parts" element={<SparePartsPage />} />
              <Route path="parts/:id" element={<SparePartDetailsPage />} />
              <Route path="dealers" element={<DealershipsPage />} />
              <Route path="showrooms/:id" element={<ShowroomDetailsPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="rental" element={<CarRentalPage />} />

              <Route path="contact" element={<ContactPage />} />
              <Route path="register-showroom" element={<RegisterShowroomPage />} />
              <Route path="dealer-dashboard" element={<DealerDashboard />} />

              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="my-ads" element={<MyAdsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="sell" element={<SellCarPage />} />
            </Route>

            {/* Admin Routes (Global, outside country scope for simplicity or can be inside if needed) */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="brands" element={<AdminBrandsPage />} />
              <Route path="cars" element={<AdminCarsPage />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="dealers" element={<AdminDealersPage />} />
              <Route path="settings" element={<AdminSettingsPage />} />
              <Route path="reports" element={<AdminReportsPage />} />
              <Route path="content" element={<AdminContentPage />} />
              <Route path="*" element={<div className="p-10 text-center text-gray-500 text-xl">Module Coming Soon</div>} />
            </Route>

            {/* Catch all redirect to root */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
