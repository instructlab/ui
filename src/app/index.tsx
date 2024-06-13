// src/app/index.tsx
'use client';

import * as React from 'react';
import { ThemeProvider } from '../context/ThemeContext';
import '@patternfly/react-core/dist/styles/base.css';
import Dashboard from './dashboard/page';

const Home: React.FunctionComponent = () => {
  return (
    <ThemeProvider>
      <Dashboard />
    </ThemeProvider>
  );
};

export default Home;
