import { lazy } from 'react';

// Route-level code splitting: each page (and the whole admin area) is only
// downloaded when first visited, keeping the home page's first load small.
// The loaders are exported so links can prefetch a page on hover.
export const loaders = {
  shop: () => import('./Shop'),
  productDetail: () => import('./ProductDetail'),
  about: () => import('./About'),
  reviews: () => import('./Reviews'),
  videos: () => import('./Videos'),
  contact: () => import('./Contact'),
  checkout: () => import('./Checkout'),
  orderConfirmed: () => import('./OrderConfirmed'),
  policy: () => import('./Policy'),
  orderPage: () => import('./OrderPage'),
  adminRoot: () => import('./admin/AdminRoot'),
  protectedRoute: () => import('../components/ProtectedRoute'),
  adminLogin: () => import('./admin/AdminLogin'),
  adminLayout: () => import('./admin/AdminLayout'),
  adminProducts: () => import('./admin/AdminProducts'),
  adminProductForm: () => import('./admin/AdminProductForm'),
  adminInquiries: () => import('./admin/AdminInquiries'),
  adminCombos: () => import('./admin/AdminCombos'),
  adminComboForm: () => import('./admin/AdminComboForm'),
  adminSettings: () => import('./admin/AdminSettings'),
  adminOrders: () => import('./admin/AdminOrders'),
  adminReturns: () => import('./admin/AdminReturns'),
  adminResetPassword: () => import('./admin/AdminResetPassword'),
};

export const Shop = lazy(loaders.shop);
export const ProductDetail = lazy(loaders.productDetail);
export const About = lazy(loaders.about);
export const Reviews = lazy(loaders.reviews);
export const Videos = lazy(loaders.videos);
export const Contact = lazy(loaders.contact);
export const Checkout = lazy(loaders.checkout);
export const OrderConfirmed = lazy(loaders.orderConfirmed);
export const Policy = lazy(loaders.policy);
export const OrderPage = lazy(loaders.orderPage);
export const AdminRoot = lazy(loaders.adminRoot);
export const ProtectedRoute = lazy(loaders.protectedRoute);
export const AdminLogin = lazy(loaders.adminLogin);
export const AdminLayout = lazy(loaders.adminLayout);
export const AdminProducts = lazy(loaders.adminProducts);
export const AdminProductForm = lazy(loaders.adminProductForm);
export const AdminInquiries = lazy(loaders.adminInquiries);
export const AdminCombos = lazy(loaders.adminCombos);
export const AdminComboForm = lazy(loaders.adminComboForm);
export const AdminSettings = lazy(loaders.adminSettings);
export const AdminOrders = lazy(loaders.adminOrders);
export const AdminReturns = lazy(loaders.adminReturns);
export const AdminResetPassword = lazy(loaders.adminResetPassword);

const routePrefetch: Record<string, () => Promise<unknown>> = {
  '/shop': loaders.shop,
  '/about': loaders.about,
  '/reviews': loaders.reviews,
  '/videos': loaders.videos,
  '/contact': loaders.contact,
  '/checkout': loaders.checkout,
};

/** Fire-and-forget download of a page's code, e.g. on link hover. */
export function prefetchRoute(path: string) {
  routePrefetch[path]?.().catch(() => {});
}
