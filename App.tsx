
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
import { CountryRedirect } from './components/CountryRedirect';
import { ContactPage } from './pages/ContactPage';
import { RegisterShowroomPage } from './pages/RegisterShowroomPage';
import { DealerDashboard } from './pages/dealer/DealerDashboard';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UpdatePasswordPage } from './pages/ResetPasswordPage';

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
import { AdminDatabasePage } from './pages/admin/AdminDatabasePage';
import { AdminSecurityPage } from './pages/admin/AdminSecurityPage';
import { AdminSeoPage } from './pages/admin/AdminSeoPage';
import { AdminHealthPage } from './pages/admin/AdminHealthPage';
import { AdminFinancePage } from './pages/admin/AdminFinancePage';
import { AdminPartsPage } from './pages/admin/AdminPartsPage';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <PageTracker />
          <Routes>
            {/* 
               ROOT PATHS: 
               These paths (e.g. /cars) now act as Redirects to /qa/cars (or user's country).
               This ensures consistent URL structure for SEO and User Experience.
            */}
            <Route path="/" element={<Layout />}>
              <Route index element={<RootRedirect />} /> {/* / -> /qa */}
              
              {/* Public Pages -> Redirect to /:countryCode/... */}
              <Route path="cars/*" element={<CountryRedirect />} />
              <Route path="parts/*" element={<CountryRedirect />} />
              <Route path="dealers/*" element={<CountryRedirect />} />
              <Route path="showrooms/*" element={<CountryRedirect />} />
              <Route path="services" element={<CountryRedirect />} />
              <Route path="rental" element={<CountryRedirect />} />
              <Route path="contact" element={<CountryRedirect />} />
              <Route path="privacy" element={<CountryRedirect />} />
              <Route path="terms" element={<CountryRedirect />} />
              
              {/* Auth & User Pages -> Redirect */}
              <Route path="login" element={<CountryRedirect />} />
              <Route path="signup" element={<CountryRedirect />} />
              <Route path="forgot-password" element={<CountryRedirect />} />
              <Route path="update-password" element={<CountryRedirect />} />
              <Route path="register-showroom" element={<CountryRedirect />} />
              <Route path="dealer-dashboard" element={<CountryRedirect />} />
              
              <Route path="favorites" element={<CountryRedirect />} />
              <Route path="my-ads" element={<CountryRedirect />} />
              <Route path="profile" element={<CountryRedirect />} />
              <Route path="sell" element={<CountryRedirect />} />
            </Route>

            {/* 
               COUNTRY SPECIFIC ROUTES:
               The actual content is rendered here.
            */}
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
              <Route path="privacy" element={<PrivacyPage />} />
              <Route path="terms" element={<TermsPage />} />
              
              <Route path="register-showroom" element={<RegisterShowroomPage />} />
              <Route path="dealer-dashboard" element={<DealerDashboard />} />
              
              <Route path="login" element={<LoginPage />} />
              <Route path="signup" element={<SignupPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="update-password" element={<UpdatePasswordPage />} />
              
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="my-ads" element={<MyAdsPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="sell" element={<SellCarPage />} />
            </Route>

            {/* Admin Routes (Global, no country prefix needed) */}
            <Route path="/admin" element={<AdminLayout />}>
               <Route index element={<AdminDashboard />} />
               <Route path="brands" element={<AdminBrandsPage />} />
               <Route path="cars" element={<AdminCarsPage />} />
               <Route path="parts" element={<AdminPartsPage />} />
               <Route path="users" element={<AdminUsersPage />} />
               <Route path="dealers" element={<AdminDealersPage />} />
               <Route path="settings" element={<AdminSettingsPage />} />
               <Route path="reports" element={<AdminReportsPage />} />
               <Route path="content" element={<AdminContentPage />} />
               
               <Route path="database" element={<AdminDatabasePage />} />
               <Route path="security" element={<AdminSecurityPage />} />
               <Route path="seo" element={<AdminSeoPage />} />
               <Route path="health" element={<AdminHealthPage />} />
               <Route path="finance" element={<AdminFinancePage />} />
               
               <Route path="*" element={<div className="p-10 text-center text-gray-500 text-xl">Page Not Found</div>} />
            </Route>
            
            {/* Catch all - Redirect to Home if unknown */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
