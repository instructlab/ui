// src/app/dashboard/page.tsx
'use client';

import React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import Documents from '@/components/Documents/Documents';

const DocumentsPage: React.FunctionComponent = () => (
  <AppLayout className="documents-page">
    <Documents />
  </AppLayout>
);

export default DocumentsPage;
