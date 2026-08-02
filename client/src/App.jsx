import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Checkout from './pages/Checkout';
import MyOrders from './pages/MyOrders';
import OrderDetail from './pages/OrderDetail';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminCustomers from './pages/admin/Customers';

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null; // wait for localStorage restore
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  function handleSearch(query) {
    setSearchQuery(query);
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    navigate(`/catalog${query ? `?${params.toString()}` : ''}`);
  }

  return (
    <Routes>
      {/* Routes with shared Layout (Header + Navbar + Footer) */}
      <Route
        path="/"
        element={
          <Layout onSearch={handleSearch}>
            <Home />
          </Layout>
        }
      />
      <Route
        path="/catalog"
        element={
          <Layout onSearch={handleSearch}>
            <Catalog />
          </Layout>
        }
      />
      <Route
        path="/products/:slug"
        element={
          <Layout onSearch={handleSearch}>
            <ProductDetail />
          </Layout>
        }
      />
      <Route
        path="/cart"
        element={
          <Layout onSearch={handleSearch}>
            <Cart />
          </Layout>
        }
      />
      <Route
        path="/checkout"
        element={
          <Layout onSearch={handleSearch}>
            <Checkout />
          </Layout>
        }
      />
      <Route
        path="/my-orders"
        element={
          <Layout onSearch={handleSearch}>
            <MyOrders />
          </Layout>
        }
      />
      <Route
        path="/my-orders/:id"
        element={
          <Layout onSearch={handleSearch}>
            <OrderDetail />
          </Layout>
        }
      />
      <Route
        path="/order-confirmation/:token"
        element={
          <Layout onSearch={handleSearch}>
            <OrderConfirmation />
          </Layout>
        }
      />

      {/* Auth pages — no shared layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Admin pages — their own layout */}
      <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
      <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
      <Route path="/admin/customers" element={<AdminRoute><AdminCustomers /></AdminRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
