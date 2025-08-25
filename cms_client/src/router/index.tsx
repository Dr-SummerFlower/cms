import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import App from '../App';
import RegisterPage from '../pages/RegisterPage.tsx';
import Protected from './protected';

const HomePage = lazy(() => import('../pages/HomePage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const ConcertDetail = lazy(() => import('../pages/ConcertDetail'));
const UserTickets = lazy(() => import('../pages/UserTickets'));
const TicketDetail = lazy(() => import('../pages/TicketDetail'));
const PurchasePage = lazy(() => import('../pages/PurchasePage'));
const UserProfileView = lazy(() => import('../pages/UserProfileView'));
const UserProfileEdit = lazy(() => import('../pages/UserProfileEdit'));

// Admin
const AdminLayout = lazy(() => import('../pages/admin/AdminLayout'));
const AdminConcerts = lazy(() => import('../pages/admin/AdminConcerts'));
const AdminUsers = lazy(() => import('../pages/admin/AdminUsers'));
const AdminRefunds = lazy(() => import('../pages/admin/AdminRefunds'));

// Inspector
const InspectorVerify = lazy(
  () => import('../pages/inspector/InspectorVerify'),
);
const InspectorVerifyHistory = lazy(()=> import('../pages/inspector/VerifyHistory.tsx'))

// Error
const ErrorPage = lazy(() => import('../pages/ErrorPage'));

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={null}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: 'login',
        element: (
          <Suspense fallback={null}>
            <LoginPage />
          </Suspense>
        ),
      },
      {
        path: 'register',
        element: (
          <Suspense fallback={null}>
            <RegisterPage />
          </Suspense>
        ),
      },
      {
        path: 'concerts/:id',
        element: (
          <Suspense fallback={null}>
            <ConcertDetail />
          </Suspense>
        ),
      },
      {
        path: 'purchase/:id',
        element: (
          <Protected roles={['USER', 'ADMIN', 'INSPECTOR']}>
            <Suspense fallback={null}>
              <PurchasePage />
            </Suspense>
          </Protected>
        ),
      },
      {
        path: 'me/tickets',
        element: (
          <Protected roles={['USER', 'ADMIN', 'INSPECTOR']}>
            <Suspense fallback={null}>
              <UserTickets />
            </Suspense>
          </Protected>
        ),
      },
      {
        path: 'me/tickets/:id',
        element: (
          <Protected roles={['USER', 'ADMIN', 'INSPECTOR']}>
            <Suspense fallback={null}>
              <TicketDetail />
            </Suspense>
          </Protected>
        ),
      },
      {
        path: 'me/profile',
        element: (
          <Protected roles={['USER', 'ADMIN', 'INSPECTOR']}>
            <Suspense fallback={null}>
              <UserProfileView />
            </Suspense>
          </Protected>
        ),
      },
      {
        path: 'me/profile/edit',
        element: (
          <Protected roles={['USER', 'ADMIN', 'INSPECTOR']}>
            <Suspense fallback={null}>
              <UserProfileEdit />
            </Suspense>
          </Protected>
        ),
      },
      {
        path: 'admin',
        element: (
          <Protected roles={['ADMIN']}>
            <Suspense fallback={null}>
              <AdminLayout />
            </Suspense>
          </Protected>
        ),
        errorElement: <ErrorPage />,
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={null}>
                <AdminConcerts />
              </Suspense>
            ),
          },
          {
            path: 'concerts',
            element: (
              <Suspense fallback={null}>
                <AdminConcerts />
              </Suspense>
            ),
          },
          {
            path: 'users',
            element: (
              <Suspense fallback={null}>
                <AdminUsers />
              </Suspense>
            ),
          },
          {
            path: 'refunds',
            element: (
              <Suspense fallback={null}>
                <AdminRefunds />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'inspector',
        element: (
          <Protected roles={['INSPECTOR', 'ADMIN']}>
            <Suspense fallback={null}>
              <InspectorVerify />
            </Suspense>
          </Protected>
        ),
        errorElement: <ErrorPage />,
      },
      {
        path: 'inspector/history',
        element: (
          <Protected roles={['INSPECTOR', 'ADMIN']}>
            <Suspense fallback={null}>
              <InspectorVerifyHistory />
            </Suspense>
          </Protected>
        ),
        errorElement: <ErrorPage />,
      },
    ],
  },
]);

export default router;
