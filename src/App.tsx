import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { AuthGuard } from './components/Auth/AuthGuard';

// Pages
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { MainRegisterPage } from './pages/auth/MainRegisterPage';
import { CustomerRegisterPage } from './pages/auth/CustomerRegisterPage';
import { VendorRegisterPage } from './pages/auth/VendorRegisterPage';
import { VendorConfirmationPage } from './pages/auth/VendorConfirmationPage';
import { WelcomePage } from './pages/WelcomePage';
import DashboardRouter from './pages/DashboardRouter';

// Components
import { BrowseVendors } from './components/Customer/BrowseVendors';
import { BusinessPage } from './components/Customer/BusinessPage';
import { CartPage } from './components/Customer/CartPage';
import { CheckoutPage } from './components/Customer/CheckoutPage';
import { OrderConfirmationPage } from './components/Customer/OrderConfirmationPage';
import { VendorDashboard } from './components/Vendor/VendorDashboard';
import { DriverDashboard } from './components/Driver/DriverDashboard';
import { AdminDashboard } from './components/Admin/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <main className="flex-grow">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<MainRegisterPage />} />
            <Route path="/register/customer" element={<CustomerRegisterPage />} />
            <Route path="/register/vendor" element={<VendorRegisterPage />} />
            <Route path="/vendor/confirmation" element={<VendorConfirmationPage />} />
            <Route path="/browse" element={<BrowseVendors />} />
            <Route path="/business/:businessId" element={<BusinessPage />} />
            
            {/* Protected Routes */}
            <Route 
              path="/welcome" 
              element={
                <AuthGuard>
                  <WelcomePage />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/cart" 
              element={
                <AuthGuard>
                  <CartPage />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/checkout" 
              element={
                <AuthGuard>
                  <CheckoutPage />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/order-confirmation/:orderId" 
              element={
                <AuthGuard>
                  <OrderConfirmationPage />
                </AuthGuard>
              } 
            />
            
            {/* Centralized Dashboard Router */}
            <Route 
              path="/dashboard" 
              element={
                <AuthGuard>
                  <DashboardRouter />
                </AuthGuard>
              } 
            />
            
            {/* Role-based Dashboard Routes - Keep for direct access */}
            <Route 
              path="/customer/*" 
              element={
                <AuthGuard requiredRole="Customer">
                  <BrowseVendors />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/vendor/*" 
              element={
                <AuthGuard requiredRole="Vendor">
                  <VendorDashboard />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/driver/*" 
              element={
                <AuthGuard requiredRole="Driver">
                  <DriverDashboard />
                </AuthGuard>
              } 
            />
            
            {/* Admin Dashboard Route - Fixed */}
            <Route 
              path="/admin" 
              element={
                <AuthGuard requiredRole="Admin">
                  <AdminDashboard />
                </AuthGuard>
              } 
            />
            
            <Route 
              path="/admin/*" 
              element={
                <AuthGuard requiredRole="Admin">
                  <AdminDashboard />
                </AuthGuard>
              } 
            />

            {/* Static Pages */}
            <Route 
              path="/how-it-works" 
              element={
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold text-gray-900">How It Works</h1>
                  <p className="text-gray-600 mt-2">Learn about our delivery process</p>
                </div>
              } 
            />
            
            <Route 
              path="/become-vendor" 
              element={
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Become a Vendor</h1>
                  <p className="text-gray-600 mt-2">Join our platform and grow your business</p>
                </div>
              } 
            />
            
            <Route 
              path="/drive-with-us" 
              element={
                <div className="p-8 text-center">
                  <h1 className="text-2xl font-bold text-gray-900">Drive With Us</h1>
                  <p className="text-gray-600 mt-2">Earn money delivering for TukTuk</p>
                </div>
              } 
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/\" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;