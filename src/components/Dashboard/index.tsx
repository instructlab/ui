import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Card, CardTitle, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useRouter } from 'next/navigation';
import { fetchPullRequests, getGitHubUsername } from '../../utils/github';
import { PullRequest } from '../../types';

const Index: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [username, setUsername] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
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

        // Sort by date (newest first)
        const sortedPRs = filteredPRs.sort((a: PullRequest, b: PullRequest) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setPullRequests(sortedPRs);
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
      <Stack hasGutter>
        {pullRequests.map((pr) => (
          <StackItem key={pr.number}>
            <Card>
              <CardTitle>{pr.title}</CardTitle>
              <CardBody>
                <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                  <FlexItem>State: {pr.state}</FlexItem>
                  <FlexItem>Created At: {new Date(pr.created_at).toLocaleString()}</FlexItem>
                  <FlexItem>Updated At: {new Date(pr.updated_at).toLocaleString()}</FlexItem>
                  <FlexItem>
                    {pr.labels.map((label) => (
                      <Label key={label.name} color="blue" style={{ marginRight: '5px' }}>
                        {label.name}
                      </Label>
                    ))}
                  </FlexItem>
                  <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
                    <Button variant="secondary" component="a" href={pr.html_url} target="_blank" rel="noopener noreferrer">
                      View PR
                    </Button>
                  </FlexItem>
                  <FlexItem alignSelf={{ default: 'alignSelfFlexEnd' }} flex={{ default: 'flexNone' }}>
                    {pr.state === 'open' && (
                      <Button variant="primary" onClick={() => handleEditClick(pr)}>
                        Edit
                      </Button>
                    )}
                  </FlexItem>
                </Flex>
              </CardBody>
            </Card>
          </StackItem>
        ))}
      </Stack>
    </PageSection>
  );
};

export { Index };
