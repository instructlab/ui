// NotFound.tsx
import * as React from 'react';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import {
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateHeader,
  EmptyStateIcon,
  PageSection,
} from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FunctionComponent = () => {
  const navigate = useNavigate();

  function handleClick() {
    navigate('/');
  }

  return (
    <PageSection>
      <EmptyState variant="full">
        <EmptyStateHeader titleText="404 Page not found" icon={<EmptyStateIcon icon={ExclamationTriangleIcon} />} headingLevel="h1" />
        <EmptyStateBody>
          We didn't find a page that matches the address you navigated to.
        </EmptyStateBody>
        <EmptyStateFooter>
          <Button onClick={handleClick}>Take me home</Button>
        </EmptyStateFooter>
      </EmptyState>
    </PageSection>
  );
};

export { NotFound };
