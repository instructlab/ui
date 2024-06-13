// pages/404.tsx
import * as React from 'react';
import { AppLayout } from '../components/AppLayout';

const NotFoundPage: React.FunctionComponent = () => {
  return (
    <AppLayout>
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>404 - Page Not Found</h1>
        <p>Sorry, the page you are looking for does not exist.</p>
      </div>
    </AppLayout>
  );
};

export default NotFoundPage;
