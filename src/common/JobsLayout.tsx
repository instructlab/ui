// src/common/JobsLayout.tsx
import React, { ReactNode } from 'react';

interface JobsLayoutProps {
  children: ReactNode;
}

const JobsLayout: React.FC<JobsLayoutProps> = ({ children }) => <div style={{ overflowX: 'auto' }}>{children}</div>;

export default JobsLayout;
