import * as React from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { PageBreadcrumb, PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Card, CardTitle, CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Flex, FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useRouter } from 'next/navigation';
import { fetchPullRequests, getGitHubUsername } from '../../utils/github';
import { PullRequest } from '../../types';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core/dist/esm/components/Breadcrumb';
import { TextContent } from '@patternfly/react-core/dist/esm/components/Text/TextContent';
import OutlinedQuestionCircleIcon from '@patternfly/react-icons/dist/esm/icons/outlined-question-circle-icon';
import { Popover } from '@patternfly/react-core/dist/esm/components/Popover';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';

const Index: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  const fetchAndSetPullRequests = React.useCallback(async () => {
    if (session?.accessToken) {
      try {
        const header = {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: 'application/vnd.github.v3+json'
        };
        const fetchedUsername = await getGitHubUsername(header);
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
    <div>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="lg">
          My Submissions
        </Title>
        <TextContent>
          View and manage your taxonomy contributions.
          <Popover
            aria-label="Basic popover"
            bodyContent={
              <div>
                Taxonomy contributions help tune the InstructLab model. Contributions can include skills that teach the model how to do something or
                knowledge that teaches the model facts, data, or references.{' '}
                <a href="https://docs.instructlab.ai" target="_blank" rel="noopener noreferrer">
                  Learn more<ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
                </a>
              </div>
            }
          >
            <OutlinedQuestionCircleIcon />
          </Popover>
        </TextContent>
      </PageSection>
      <PageSection>
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
    </div>
  );
};

export { Index };
