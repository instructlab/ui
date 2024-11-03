// src/components/Experimental/DashboardLocal/index.tsx
import * as React from 'react';
import { Card, CardTitle, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/esm/components/Breadcrumb';
import { Spinner } from '@patternfly/react-core/dist/esm/components/Spinner';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/esm/components/Modal';

const DashboardLocal: React.FunctionComponent = () => {
  const [branches, setBranches] = React.useState<string[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mergeStatus, setMergeStatus] = React.useState<{ branch: string; message: string; success: boolean } | null>(null);
  const [diffData, setDiffData] = React.useState<{ branch: string; changes: { file: string; status: string }[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);

  // Fetch branches from the API route
  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/local/git/branches');
        const result = await response.json();
        if (response.ok) {
          setBranches(result.branches);
        } else {
          console.error('Failed to fetch branches:', result.error);
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleMerge = async (branchName: string) => {
    setMergeStatus(null); // Clear previous status
    try {
      const response = await fetch('/api/local/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'merge' })
      });

      const result = await response.json();
      if (response.ok) {
        setMergeStatus({ branch: branchName, message: result.message, success: true });
      } else {
        setMergeStatus({ branch: branchName, message: result.error, success: false });
      }
    } catch (error) {
      setMergeStatus({ branch: branchName, message: 'Merge failed due to an unexpected error.', success: false });
      console.error('Error merging branch:', error);
    }
  };

  const handleShowChanges = async (branchName: string) => {
    try {
      const response = await fetch('/api/local/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'diff' })
      });

      const result = await response.json();
      if (response.ok) {
        setDiffData({ branch: branchName, changes: result.changes });
        setIsModalOpen(true);
      } else {
        console.error('Failed to get branch changes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branch changes:', error);
    }
  };

  return (
    <div>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="lg">
          Git Repository Branches
        </Title>
        <p>Listing all branches from the local repository:</p>
      </PageSection>

      <PageSection>
        {isLoading ? (
          <Spinner size="lg" />
        ) : branches.length === 0 ? (
          <p>No branches found in the repository.</p>
        ) : (
          <Stack hasGutter>
            {branches.map((branch) => (
              <StackItem key={branch}>
                <Card>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>
                        <CardTitle>Branch Name: {branch}</CardTitle>
                      </FlexItem>
                      <FlexItem align={{ default: 'alignRight' }}>
                        {branch !== 'main' && (
                          <>
                            <Button variant="primary" onClick={() => handleMerge(branch)} style={{ marginRight: '8px' }}>
                              Merge into Main
                            </Button>
                            <Button variant="secondary" onClick={() => handleShowChanges(branch)}>
                              Show Changes
                            </Button>
                          </>
                        )}
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </StackItem>
            ))}
          </Stack>
        )}

        {mergeStatus && (
          <PageSection variant="light">
            <p style={{ color: mergeStatus.success ? 'green' : 'red' }}>{mergeStatus.message}</p>
          </PageSection>
        )}

        <Modal
          variant={ModalVariant.medium}
          title={`Changes in ${diffData?.branch} compared to main`}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        >
          {diffData?.changes.length ? (
            <ul>
              {diffData.changes.map((change) => (
                <li key={change.file}>
                  {change.file} - <strong>{change.status}</strong>
                </li>
              ))}
            </ul>
          ) : (
            <p>No differences found.</p>
          )}
        </Modal>
      </PageSection>
    </div>
  );
};

export { DashboardLocal };
