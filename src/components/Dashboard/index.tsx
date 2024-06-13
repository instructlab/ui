// src/components/Dashboard/index.tsx
'use client';

import * as React from 'react';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';

const Index: React.FunctionComponent = () => {
  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">
        Dashboard
      </Title>
      TODO
    </PageSection>
  );
};

export { Index };
