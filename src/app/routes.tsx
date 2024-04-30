// routes.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@app/common/AuthContext';
import { NotFound } from '@app/NotFound/NotFound';
import { Dashboard } from '@app/Dashboard/Dashboard';
import { AllJobs } from '@app/Jobs/All/All';
import { FailedJobs } from '@app/Jobs/Failed/Failed';
import { PendingJobs } from '@app/Jobs/Pending/Pending';
import { RunningJobs } from '@app/Jobs/Running/Running';
import { SuccessJobs } from '@app/Jobs/Success/Success';
import Login from '@app/Login/Login';
import { useDocumentTitle } from '@app/utils/useDocumentTitle';

const PrivateRoute = ({ element }: { element: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" replace />;
};

export interface IAppRoute {
  label?: string;
  path: string;
  title: string;
  element: React.ReactNode;
  routes?: IAppRoute[];
}

export interface IAppRouteGroup {
  label: string;
  routes: IAppRoute[];
}

const routes: Array<IAppRoute | IAppRouteGroup> = [
  {
    path: '/',
    element: <PrivateRoute element={<Dashboard />} />,
    label: 'Dashboard',
    title: 'Main Dashboard',
  },
  {
    label: 'Jobs',
    routes: [
      {
        path: '/jobs/all',
        element: <PrivateRoute element={<AllJobs />} />,
        label: 'All',
        title: 'All Jobs',
      },
      {
        path: '/jobs/running',
        element: <PrivateRoute element={<RunningJobs />} />,
        label: 'Running',
        title: 'Running Jobs',
      },
      {
        path: '/jobs/pending',
        element: <PrivateRoute element={<PendingJobs />} />,
        label: 'Pending',
        title: 'Pending Jobs',
      },
      {
        path: '/jobs/failed',
        element: <PrivateRoute element={<FailedJobs />} />,
        label: 'Failed',
        title: 'Failed Jobs',
      },
      {
        path: '/jobs/success',
        element: <PrivateRoute element={<SuccessJobs />} />,
        label: 'Success',
        title: 'Successful Jobs',
      },
    ],
    title: 'Jobs',
  },
  {
    path: '*',
    element: <NotFound />,
    title: '404 Not Found',
  },
];

export const AppRoutes = (): React.ReactElement => (
  <Routes>
    <Route path="/login" element={<Login />} />
    {routes.map((route, idx) =>
      'routes' in route ? (
        route.routes?.map((subRoute) => (
          <Route key={subRoute.path} path={subRoute.path} element={<PrivateRoute element={subRoute.element} />} />
        ))
      ) : (
        <Route key={route.path} path={route.path} element={route.element} />
      ),
    )}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export { AppRoutes, routes };
