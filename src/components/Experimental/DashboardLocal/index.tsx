// src/components/Experimental/DashboardLocal/index.tsx
import * as React from 'react';
import { Card, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/esm/components/Breadcrumb';
import { Spinner } from '@patternfly/react-core/dist/esm/components/Spinner';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { Modal, ModalVariant } from '@patternfly/react-core/dist/esm/deprecated/components/Modal';
import { EmptyState, EmptyStateBody, EmptyStateFooter, EmptyStateActions } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import GithubIcon from '@patternfly/react-icons/dist/esm/icons/github-icon';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

const DashboardLocal: React.FunctionComponent = () => {
  const [branches, setBranches] = React.useState<{ name: string; creationDate: number }[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mergeStatus] = React.useState<{ branch: string; message: string; success: boolean } | null>(null);
  const [diffData, setDiffData] = React.useState<{ branch: string; changes: { file: string; status: string }[] } | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const router = useRouter();

  // Fetch branches from the API route
  React.useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch('/api/local/git/branches');
        const result = await response.json();
        if (response.ok) {
          // Filter out 'main' branch
          const filteredBranches = result.branches.filter((branch: { name: string }) => branch.name !== 'main');
          setBranches(filteredBranches);
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

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  // Disabling Merge for now, leaving the code for when we re-implement the feature.
  // const handleMerge = async (branchName: string) => {
  //   setMergeStatus(null); // Clear previous status
  //   try {
  //     const response = await fetch('/api/local/git/branches', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ branchName, action: 'merge' })
  //     });
  //
  //     const result = await response.json();
  //     if (response.ok) {
  //       setMergeStatus({ branch: branchName, message: result.message, success: true });
  //     } else {
  //       setMergeStatus({ branch: branchName, message: result.error, success: false });
  //     }
  //   } catch (error) {
  //     setMergeStatus({ branch: branchName, message: 'Merge failed due to an unexpected error.', success: false });
  //     console.error('Error merging branch:', error);
  //   }
  // };

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
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false} style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="lg">
          Local Git Repository Branches
        </Title>
      </PageSection>

      <PageSection hasBodyWrapper={false}>
        {isLoading ? (
          <Spinner size="lg" />
        ) : branches.length === 0 ? (
          <EmptyState headingLevel="h4" titleText="Welcome to InstructLab" icon={InstructLabLogo}>
            <EmptyStateBody>
              <div style={{ maxWidth: '60ch' }}>
                InstructLab is a powerful and accessible tool for advancing generative AI through community collaboration and open-source principles.
                By contributing your own data, you can help train and refine the language model. <br />
                <br />
                To get started, contribute a skill or contribute knowledge.
              </div>
            </EmptyStateBody>
            <EmptyStateFooter>
              <EmptyStateActions>
                <Button variant="primary" onClick={() => router.push('/experimental/contribute-local/configuration-local/')}>
                  Clone a taxonomy
                </Button>
                <Button variant="primary" onClick={() => router.push('/experimental/contribute-local/skill/')}>
                  Contribute Skill
                </Button>
                <Button variant="primary" onClick={() => router.push('/experimental/contribute-local/knowledge/')}>
                  Contribute Knowledge
                </Button>
                <Button variant="primary" onClick={() => router.push('/playground/chat')}>
                  Chat with the Models
                </Button>
              </EmptyStateActions>
              <EmptyStateActions>
                <Button
                  variant="link"
                  icon={<GithubIcon />}
                  iconPosition="right"
                  component="a"
                  href="https://github.com/instructlab"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View the Project on Github
                </Button>
              </EmptyStateActions>
            </EmptyStateFooter>
          </EmptyState>
        ) : (
          <Stack hasGutter>
            {branches.map((branch) => (
              <StackItem key={branch.name}>
                <Card>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>
                        Branch Name: {branch.name}
                        <br />
                        Created on: {formatDateTime(branch.creationDate)}
                      </FlexItem>
                      <FlexItem align={{ default: 'alignRight' }}>
                        {/*<Button variant="primary" onClick={() => handleMerge(branch.name)} style={{ marginRight: '8px' }}>*/}
                        {/*  Merge into Main*/}
                        {/*</Button>*/}
                        <Button variant="secondary" onClick={() => handleShowChanges(branch.name)}>
                          Show Changes
                        </Button>
                      </FlexItem>
                    </Flex>
                  </CardBody>
                </Card>
              </StackItem>
            ))}
          </Stack>
        )}

        {mergeStatus && (
          <PageSection hasBodyWrapper={false}>
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
