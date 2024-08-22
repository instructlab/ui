// src/app/dashboard/page.tsx
'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { useRouter } from 'next/navigation';
import { Chip } from '@patternfly/react-core/dist/dynamic/components/Chip';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Table, Thead, Tr, Th, Td, Tbody, ThProps } from '@patternfly/react-table';
import { fetchPullRequests, getGitHubUsername } from '../../utils/github';
import { PullRequest } from '../../types';

const Index: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [username, setUsername] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSortIndex, setActiveSortIndex] = React.useState<number | undefined>(undefined);
  const [activeSortDirection, setActiveSortDirection] = React.useState<'asc' | 'desc' | undefined>(undefined);
  const router = useRouter();

  const fetchAndSetPullRequests = React.useCallback(async () => {
    if (session?.accessToken) {
      try {
        const fetchedUsername = await getGitHubUsername(session.accessToken);
        setUsername(fetchedUsername);
        const data = await fetchPullRequests(session.accessToken);
        const filteredPRs = data.filter(
          (pr: PullRequest) => pr.user.login === fetchedUsername && pr.labels.some((label) => label.name === 'skill' || label.name === 'knowledge')
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

  const getSortableRowValues = (pr: PullRequest): (string | number)[] => {
    const labels = pr.labels.map((label) => label.name).join(', ');
    return [pr.title, pr.user.login, pr.state, new Date(pr.created_at).getTime(), new Date(pr.updated_at).getTime(), labels];
  };

  let sortedPullRequests = pullRequests;
  if (activeSortIndex !== undefined) {
    sortedPullRequests = pullRequests.sort((a, b) => {
      const aValue = getSortableRowValues(a)[activeSortIndex];
      const bValue = getSortableRowValues(b)[activeSortIndex];

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return activeSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        return activeSortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      return 0;
    });
  }

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: activeSortIndex,
      direction: activeSortDirection
    },
    onSort: (_event, index, direction) => {
      setActiveSortIndex(index);
      setActiveSortDirection(direction as 'asc' | 'desc');
    },
    columnIndex
  });

  const handleEditClick = (pr: PullRequest) => {
    const hasKnowledgeLabel = pr.labels.some((label) => label.name === 'knowledge');
    const hasSkillLabel = pr.labels.some((label) => label.name === 'skill');

    if (hasKnowledgeLabel) {
      router.push(`/edit-submission/knowledge/${pr.number}`);
    } else if (hasSkillLabel) {
      router.push(`/edit-submission/skill/${pr.number}`);
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  return (
    <PageSection>
      <Title headingLevel="h1" size="lg">
        Taxonomy Submissions for {username || 'Loading...'}
      </Title>
      <div style={{ marginBottom: '20px' }} />
      {error && <div>{error}</div>}
      <Table aria-label="Pull Requests">
        <Thead>
          <Tr>
            <Th sort={getSortParams(0)}>Title</Th>
            <Th sort={getSortParams(1)}>Author</Th>
            <Th sort={getSortParams(2)}>State</Th>
            <Th sort={getSortParams(3)}>Created At</Th>
            <Th sort={getSortParams(4)}>Updated At</Th>
            <Th>Link</Th>
            <Th sort={getSortParams(5)}>Labels</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {sortedPullRequests.map((pr) => (
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
