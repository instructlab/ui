// src/components/dashboard/github/dashboard.tsx
import * as React from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { DraftEditFormInfo, PullRequest } from '@/types';
import { useState } from 'react';
import {
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
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, GithubIcon, EllipsisVIcon, PficonTemplateIcon } from '@patternfly/react-icons';
import { deleteDraftData, fetchDraftContributions } from '@/components/Contribute/Utils/autoSaveUtils';
import { handleTaxonomyDownload } from '@/utils/taxonomy';
import { fetchPullRequests, getGitHubUsername } from '@/utils/github';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

const DashboardGithub: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [pullRequests, setPullRequests] = React.useState<PullRequest[]>([]);
  const [draftContributions, setDraftContributions] = React.useState<DraftEditFormInfo[]>([]);
  const [isDownloadDone, setIsDownloadDone] = React.useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  //const [error, setError] = React.useState<string | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<{ [key: number | string]: boolean }>({});
  const router = useRouter();

  React.useEffect(() => {
    const fetchAndSetPullRequests = async () => {
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
          console.error('Failed to fetch pull requests.' + error);
        }
      }
    };

    fetchAndSetPullRequests().then(() => {
      setIsLoading(false);
    });

    const intervalId = setInterval(fetchAndSetPullRequests, 60000);

    return () => clearInterval(intervalId);
  }, [session?.accessToken]);

  React.useEffect(() => {
    // Fetch all the draft contributions and mark them submitted if present in the pull requests
    const drafts = fetchDraftContributions().map((draft: DraftEditFormInfo) => ({
      ...draft,
      isSubmitted: pullRequests.some((pr) => pr.head.ref === draft.branchName)
    }));

    setDraftContributions(drafts);
  }, [pullRequests]);

  const handleDeleteDraftContribution = async (branchName: string) => {
    deleteDraftData(branchName);
    const drafts = draftContributions.filter((item) => item.branchName != branchName);
    setDraftContributions(drafts);
  };

  const handleEditDraftContribution = (branchName: string) => {
    // Check if branchName contains string "knowledge"
    if (branchName.includes('knowledge')) {
      router.push(`/contribute/knowledge/github/${branchName}/isDraft`);
    } else {
      router.push(`/contribute/skill/github/${branchName}/isDraft`);
    }
  };

  const handleEditClick = (pr: PullRequest) => {
    const hasKnowledgeLabel = pr.labels.some((label) => label.name === 'knowledge');
    const hasSkillLabel = pr.labels.some((label) => label.name === 'skill');

    if (draftContributions.find((draft) => draft.branchName == pr.head.ref)) {
      // If user is editing the submitted contribution, use the latest data from draft, if available.
      // Pass the pr number as well, it's required to pull the data from PR.
      if (hasKnowledgeLabel) {
        router.push(`/contribute/knowledge/github/${pr.head.ref}/isDraft`);
      } else {
        router.push(`/contribute/skill/github/${pr.head.ref}/isDraft`);
      }
    } else {
      if (hasKnowledgeLabel) {
        router.push(`/contribute/knowledge/github/${pr.number}`);
      } else if (hasSkillLabel) {
        router.push(`/contribute/skill/github/${pr.number}`);
      }
    }
  };

  const handleOnClose = () => {
    setIsLoading(false);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const onActionMenuToggle = (id: number | string, isOpen: boolean) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: isOpen
    }));
  };

  const onActionMenuSelect = (id: number | string) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: false
    }));
  };

  return (
    <>
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
        {isLoading && (
          <Modal variant={ModalVariant.small} title="Retrieving your submissions" isOpen onClose={() => handleOnClose()}>
            <ModalBody>
              <div>
                <Spinner size="md" />
                Retrieving all your skills and knowledge submissions from taxonomy repository.
              </div>
            </ModalBody>
          </Modal>
        )}
        {!isDownloadDone && (
          <Modal variant={ModalVariant.small} title="Retrieving taxonomy tar file" isOpen onClose={() => setIsDownloadDone(true)}>
            <ModalBody>
              <div>
                <Spinner size="md" />
                Retrieving the taxonomy compressed file with the contributed data.
              </div>
            </ModalBody>
          </Modal>
        )}
        {!isLoading && pullRequests.length === 0 && draftContributions.length === 0 ? (
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
            {draftContributions.map(
              (draft, index) =>
                !pullRequests.find((pr) => pr.head.ref == draft.branchName) && (
                  <GalleryItem key={draft.branchName}>
                    <Card>
                      <CardHeader
                        actions={{
                          actions: (
                            <Dropdown
                              onSelect={() => onActionMenuSelect(draft.branchName)}
                              toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                                <MenuToggle
                                  ref={toggleRef}
                                  isExpanded={isActionMenuOpen[draft.branchName] || false}
                                  onClick={() => onActionMenuToggle(draft.branchName, !isActionMenuOpen[draft.branchName])}
                                  variant="plain"
                                  aria-label="contribution action menu"
                                  icon={<EllipsisVIcon aria-hidden="true" />}
                                />
                              )}
                              isOpen={isActionMenuOpen[draft.branchName] || false}
                              onOpenChange={(isOpen: boolean) => onActionMenuToggle(draft.branchName, isOpen)}
                              popperProps={{ position: 'end' }}
                            >
                              <DropdownList>
                                <DropdownItem key="edit-contribution" onClick={() => handleEditDraftContribution(draft.branchName)}>
                                  Edit contribution
                                </DropdownItem>
                                <DropdownItem key="delete-contribution" onClick={() => handleDeleteDraftContribution(draft.branchName)}>
                                  Delete contribution
                                </DropdownItem>
                              </DropdownList>
                            </Dropdown>
                          )
                        }}
                      >
                        <CardTitle>
                          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                            <Label icon={<PficonTemplateIcon />} color="green">
                              Draft
                            </Label>
                            {draft.title ? draft.title : `Untitled ${index + 1}`}
                          </Flex>
                        </CardTitle>
                      </CardHeader>
                      <CardBody>
                        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                          <FlexItem>Branch name: {draft.branchName}</FlexItem>
                          <FlexItem>State: Draft</FlexItem>
                          <FlexItem>Last updated: {draft.lastUpdated}</FlexItem>
                          <FlexItem>
                            {draft.isKnowledgeDraft ? (
                              <Label key="knowledge" color="blue" style={{ marginRight: '5px' }}>
                                Knowledge
                              </Label>
                            ) : (
                              <Label key="skill" color="blue" style={{ marginRight: '5px' }}>
                                Skill
                              </Label>
                            )}
                          </FlexItem>
                        </Flex>
                      </CardBody>
                    </Card>
                  </GalleryItem>
                )
            )}

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
                          popperProps={{ position: 'end' }}
                        >
                          <DropdownList>
                            <DropdownItem key="view-pr" to={pr.html_url} target="_blank" rel="noopener noreferrer">
                              View PR
                            </DropdownItem>
                            {pr.state === 'open' && (
                              <DropdownItem key="edit-contribution" onClick={() => handleEditClick(pr)}>
                                Edit contribution
                              </DropdownItem>
                            )}
                            {pr.state === 'closed' && (
                              <DropdownItem key="edit-contribution" isDisabled>
                                Edit contribution
                              </DropdownItem>
                            )}
                          </DropdownList>
                          <DropdownItem
                            key="download-taxonomy"
                            onClick={() => {
                              setIsDownloadDone(false);
                              handleTaxonomyDownload({ branchName: pr.head.ref, isGithubMode: true, setIsDownloadDone });
                            }}
                          >
                            Download taxonomy
                          </DropdownItem>
                        </Dropdown>
                      )
                    }}
                  >
                    <CardTitle>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        {draftContributions.find((draft) => draft.branchName == pr.head.ref) && (
                          <Label icon={<PficonTemplateIcon />} color="green">
                            Draft
                          </Label>
                        )}
                        {pr.title}
                      </Flex>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>Branch name: {pr.head.ref}</FlexItem>
                      <FlexItem>State: {pr.state}</FlexItem>
                      <FlexItem>Last updated: {new Date(pr.updated_at).toUTCString()}</FlexItem>
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
    </>
  );
};

export { DashboardGithub };
