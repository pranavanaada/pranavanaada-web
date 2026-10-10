import { Suspense } from 'react';
import { Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FloatingWhatsApp from './components/FloatingWhatsApp';
import ScrollToTop from './components/ScrollToTop';
import CartDrawer from './components/CartDrawer';
import CartSync from './components/CartSync';
import { CartProvider } from './hooks/useCart';
import { PageTransition } from './components/motion';
import Home from './pages/Home';
import {
  Shop,
  ProductDetail,
  About,
  Reviews,
  Videos,
  Contact,
  Checkout,
  OrderConfirmed,
  Policy,
  AdminRoot,
  ProtectedRoute,
  AdminLogin,
  AdminLayout,
  AdminProducts,
  AdminProductForm,
  AdminInquiries,
  AdminCombos,
  AdminComboForm,
  AdminSettings,
  AdminOrders,
  AdminResetPassword,
} from './pages/lazy';

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center" aria-label="Loading">
      <span className="w-8 h-8 rounded-full border-2 border-gold/30 border-t-gold animate-spin" />
    </div>
  );
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <>
      <Navbar />
      <Suspense fallback={<PageFallback />}>
        {/* Keyed by path so the fade-in replays on every navigation */}
        <PageTransition key={pathname}>{children}</PageTransition>
      </Suspense>
      <Footer />
      <FloatingWhatsApp />
      <CartDrawer />
      <CartSync />
    </>
  );
}

export default function App() {
  return (
    // reducedMotion="user" turns off transform animations for visitors who
    // have "reduce motion" enabled in their OS settings.
    <MotionConfig reducedMotion="user">
      <CartProvider>
        <ScrollToTop />
        <Routes>
          {/* Public site — no login required */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/shop" element={<PublicLayout><Shop /></PublicLayout>} />
          <Route path="/shop/:id" element={<PublicLayout><ProductDetail /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
          <Route path="/reviews" element={<PublicLayout><Reviews /></PublicLayout>} />
          <Route path="/videos" element={<PublicLayout><Videos /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
          <Route path="/checkout" element={<PublicLayout><Checkout /></PublicLayout>} />
          <Route path="/order-confirmed" element={<PublicLayout><OrderConfirmed /></PublicLayout>} />
          <Route path="/policies" element={<Navigate to="/policies/returns" replace />} />
          <Route path="/policies/:slug" element={<PublicLayout><Policy /></PublicLayout>} />

          {/* Admin — login required. Loaded on demand, with its own auth provider. */}
          <Route
            element={
              <Suspense fallback={<PageFallback />}>
                <AdminRoot />
              </Suspense>
            }
          >
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductForm />} />
              <Route path="products/:id/edit" element={<AdminProductForm />} />
              <Route path="inquiries" element={<AdminInquiries />} />
              <Route path="combos" element={<AdminCombos />} />
              <Route path="combos/new" element={<AdminComboForm />} />
              <Route path="combos/:id/edit" element={<AdminComboForm />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="orders" element={<AdminOrders />} />
            </Route>
          </Route>
        </Routes>
      </CartProvider>
    </MotionConfig>
  );
}
