// src/app/dashboard/page.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Chip } from '@patternfly/react-core/dist/dynamic/components/Chip';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Table, Thead, Tr, Th, Td, Tbody } from '@patternfly/react-table';
import { fetchPullRequests, getGitHubUsername } from '../../utils/github';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { PullRequest } from '../../types';

const Index: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const fetchAndSetPullRequests = React.useCallback(async () => {
    if (session?.accessToken) {
      try {
        const username = await getGitHubUsername(session.accessToken);
        const data = await fetchPullRequests(session.accessToken);
        // Filter PRs to include only those with 'skill' or 'knowledge' labels and owned by the logged-in user
        const filteredPRs = data.filter(
          (pr: PullRequest) => pr.user.login === username && pr.labels.some((label) => label.name === 'skill' || label.name === 'knowledge')
        );
        setPullRequests(filteredPRs);
      } catch (error) {
        setError('Failed to fetch pull requests.');
      }
    }
  }, [session?.accessToken]);

  React.useEffect(() => {
    fetchAndSetPullRequests();
    const intervalId = setInterval(fetchAndSetPullRequests, 60000);
    return () => clearInterval(intervalId);
  }, [session, fetchAndSetPullRequests]);

  if (!session) {
    return <div>Loading...</div>;
  }

  const handleEditClick = (pr: PullRequest) => {
    const hasKnowledgeLabel = pr.labels.some((label) => label.name === 'knowledge');
    const hasSkillLabel = pr.labels.some((label) => label.name === 'skill');

    if (hasKnowledgeLabel) {
      router.push(`/edit-submission/knowledge/${pr.number}`);
    } else if (hasSkillLabel) {
      router.push(`/edit-submission/skill/${pr.number}`);
    }
  };

  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">
        Dashboard
      </Title>
      {error && <div>{error}</div>}
      <Table aria-label="Pull Requests">
        <Thead>
          <Tr>
            <Th>Title</Th>
            <Th>Author</Th>
            <Th>State</Th>
            <Th>Created At</Th>
            <Th>Updated At</Th>
            <Th>Link</Th>
            <Th>Labels</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {pullRequests.map((pr) => (
            <Tr key={pr.number}>
              <Td>{pr.title}</Td>
              <Td>{pr.user.login}</Td>
              <Td>{pr.state}</Td>
              <Td>{new Date(pr.created_at).toLocaleString()}</Td>
              <Td>{new Date(pr.updated_at).toLocaleString()}</Td>
              <Td>
                <a href={pr.html_url} target="_blank" rel="noopener noreferrer">
                  View PR
                </a>
              </Td>
              <Td>
                {pr.labels.map((label) => (
                  <Chip key={label.name} isReadOnly>
                    {label.name}
                  </Chip>
                ))}
              </Td>
              <Td>
                {pr.state === 'open' && (
                  <Button variant="primary" onClick={() => handleEditClick(pr)}>
                    Edit
                  </Button>
                )}
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </PageSection>
  );
};

export { Index };
