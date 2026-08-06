import { Routes } from '@angular/router';
import {
  guestGuard,
  inactiveScreenGuard,
  pendingScreenGuard,
  pendingVerificationGuard,
} from './core/auth/auth.guards';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/landing/landing').then((m) => m.Landing),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/register/register-shop').then((m) => m.RegisterShop),
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/login/login').then((m) => m.Login),
  },
  {
    path: 'pending',
    canActivate: [pendingScreenGuard],
    loadComponent: () =>
      import('./features/pending/pending-review').then((m) => m.PendingReview),
  },
  {
    path: 'inactive',
    canActivate: [inactiveScreenGuard],
    loadComponent: () =>
      import('./features/inactive/account-inactive').then(
        (m) => m.AccountInactivePage,
      ),
  },
  {
    path: '',
    canActivate: [pendingVerificationGuard],
    loadComponent: () =>
      import('./layout/shop-shell').then((m) => m.ShopShell),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./features/home/home').then((m) => m.Home),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./features/catalog/catalog').then((m) => m.Catalog),
      },
      {
        path: 'catalog/:id',
        loadComponent: () =>
          import('./features/catalog/product-detail').then(
            (m) => m.ProductDetail,
          ),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout').then((m) => m.Checkout),
      },
      {
        path: 'wallet',
        loadComponent: () =>
          import('./features/wallet/wallet').then((m) => m.WalletPage),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders').then((m) => m.OrdersPage),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail').then((m) => m.OrderDetail),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./features/invoices/invoices').then((m) => m.InvoicesPage),
      },
      {
        path: 'invoices/:id',
        loadComponent: () =>
          import('./features/invoices/invoice-detail').then(
            (m) => m.InvoiceDetail,
          ),
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./features/returns/returns').then((m) => m.ReturnsPage),
      },
      {
        path: 'returns/new/:orderId',
        loadComponent: () =>
          import('./features/returns/return-create').then(
            (m) => m.ReturnCreatePage,
          ),
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/reports/shop-reports').then(
            (m) => m.ShopReportsPage,
          ),
      },
      {
        path: 'special-requests',
        loadComponent: () =>
          import('./features/special-requests/special-requests').then(
            (m) => m.SpecialRequestsPage,
          ),
      },
      {
        path: 'repairs',
        loadComponent: () =>
          import('./features/repairs/repairs').then((m) => m.RepairsPage),
      },
      {
        path: 'customer-app',
        loadComponent: () =>
          import('./features/customer-app/customer-app-settings').then(
            (m) => m.CustomerAppSettings,
          ),
      },
      {
        path: 'shop-products',
        loadComponent: () =>
          import('./features/shop-products/shop-products').then(
            (m) => m.ShopProductsPage,
          ),
      },
      {
        path: 'support',
        loadComponent: () =>
          import('./features/support/support-chat').then((m) => m.SupportChat),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/profile/shop-profile').then((m) => m.ShopProfilePage),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
