// NotFound.tsx
import * as React from 'react';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/dynamic/icons/exclamation-triangle-icon';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button'
import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState'
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState'
import { EmptyStateFooter } from '@patternfly/react-core/dist/dynamic/components/EmptyState'
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState'
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState'
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page'
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
          We did not find a page that matches the address you navigated to.
        </EmptyStateBody>
        <EmptyStateFooter>
          <Button onClick={handleClick}>Take me home</Button>
        </EmptyStateFooter>
      </EmptyState>
    </PageSection>
  );
};

export { NotFound };
