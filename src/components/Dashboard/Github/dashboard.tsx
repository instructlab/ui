// src/components/dashboard/github/dashboard.tsx
import * as React from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchPullRequests, getGitHubUsername } from '../../../utils/github';
import { PullRequest } from '../../../types';
import { useState } from 'react';
import {
  PageBreadcrumb,
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Title,
  Content,
  Popover,
  Button,
  Modal,
  ModalVariant,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Card,
  CardTitle,
  CardBody,
  Flex,
  FlexItem,
  Label,
  ModalBody,
  CardHeader,
  Dropdown,
  MenuToggle,
  DropdownList,
  DropdownItem,
  MenuToggleElement,
  Gallery,
  GalleryItem
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, GithubIcon, EllipsisVIcon } from '@patternfly/react-icons';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

const DashboardGithub: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [isFirstPullDone, setIsFirstPullDone] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  //const [error, setError] = React.useState<string | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<{ [key: number]: boolean }>({});
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
        console.log('Failed to fetch pull requests.' + error);
      }
      setIsFirstPullDone(true);
      setIsLoading(false);
    } else {
      setIsLoading(false);
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
      router.push(`/edit-submission/knowledge/github/${pr.number}`);
    } else if (hasSkillLabel) {
      router.push(`/edit-submission/skill/github/${pr.number}`);
    }
  };

  const handleOnClose = () => {
    setIsLoading(false);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const onActionMenuToggle = (id: number, isOpen: boolean) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: isOpen
    }));
  };

  const onActionMenuSelect = (id: number) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: false
    }));
  };

  return (
    <div>
      <PageBreadcrumb hasBodyWrapper={false}>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection hasBodyWrapper={false}>
        <Title headingLevel="h1" size="lg">
          My Submissions
        </Title>
        <Content>
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
            <Button variant="plain" aria-label="more information">
              <OutlinedQuestionCircleIcon />
            </Button>
          </Popover>
        </Content>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <div style={{ marginBottom: '20px' }} />
        {!isFirstPullDone && (
          <Modal variant={ModalVariant.small} title="Retrieving your submissions" isOpen={isLoading} onClose={() => handleOnClose()}>
            <ModalBody>
              <div>
                <Spinner size="md" />
                Retrieving all your skills and knowledge submissions from taxonomy repository.
              </div>
            </ModalBody>
          </Modal>
        )}
        {isFirstPullDone && pullRequests.length === 0 ? (
          <EmptyState titleText="Welcome to InstructLab" headingLevel="h4" icon={InstructLabLogo}>
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
                <Button variant="primary" onClick={() => router.push('/contribute/skill')}>
                  Contribute Skill
                </Button>
                <Button variant="primary" onClick={() => router.push('/contribute/knowledge')}>
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
          <Gallery
            hasGutter
            minWidths={{
              md: '400px',
              lg: '450px',
              xl: '500px',
              '2xl': '600px'
            }}
          >
            {pullRequests.map((pr) => (
              <GalleryItem key={pr.number}>
                <Card>
                  <CardHeader
                    actions={{
                      actions: (
                        <Dropdown
                          onSelect={() => onActionMenuSelect(pr.number)}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              isExpanded={isActionMenuOpen[pr.number] || false}
                              onClick={() => onActionMenuToggle(pr.number, !isActionMenuOpen[pr.number])}
                              variant="plain"
                              aria-label="contribution action menu"
                              icon={<EllipsisVIcon aria-hidden="true" />}
                            />
                          )}
                          isOpen={isActionMenuOpen[pr.number] || false}
                          onOpenChange={(isOpen: boolean) => onActionMenuToggle(pr.number, isOpen)}
                        >
                          <DropdownList>
                            <DropdownItem key="view-pr" to={pr.html_url} target="_blank" rel="noopener noreferrer">
                              View PR
                            </DropdownItem>
                            {pr.state === 'open' && (
                              <DropdownItem key="edit-contribution" onClick={() => handleEditClick(pr)}>
                                Edit Contribution
                              </DropdownItem>
                            )}
                            {pr.state === 'closed' && (
                              <DropdownItem key="edit-contribution" isDisabled>
                                Edit Contribution
                              </DropdownItem>
                            )}
                          </DropdownList>
                        </Dropdown>
                      )
                    }}
                  >
                    <CardTitle>{pr.title}</CardTitle>
                  </CardHeader>
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
                    </Flex>
                  </CardBody>
                </Card>
              </GalleryItem>
            ))}
          </Gallery>
        )}
      </PageSection>
    </div>
  );
};

export { DashboardGithub };
