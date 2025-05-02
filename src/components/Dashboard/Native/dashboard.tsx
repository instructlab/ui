// src/components/Dashboard/Native/dashboard.tsx
import * as React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  AlertProps,
  PageSection,
  Title,
  Content,
  Popover,
  Button,
  AlertGroup,
  Alert,
  AlertVariant,
  AlertActionCloseButton,
  Spinner,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  EmptyStateActions,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Modal,
  ModalVariant,
  ModalBody,
  ModalFooter,
  ModalHeader,
  DropdownItem,
  Dropdown,
  MenuToggleElement,
  MenuToggle,
  DropdownList,
  CardHeader,
  CardTitle,
  Gallery,
  GalleryItem,
  Label
} from '@patternfly/react-core';
import { ExternalLinkAltIcon, OutlinedQuestionCircleIcon, GithubIcon, EllipsisVIcon, PficonTemplateIcon } from '@patternfly/react-icons';
import { ExpandableSection } from '@patternfly/react-core/dist/esm/components/ExpandableSection/ExpandableSection';
import { v4 as uuidv4 } from 'uuid';
import { DraftEditFormInfo } from '@/types';
import { deleteDraftData, fetchDraftContributions } from '@/components/Contribute/Utils/autoSaveUtils';
import { handleTaxonomyDownload } from '@/utils/taxonomy';
import { useEnvConfig } from '@/context/EnvConfigContext';

const InstructLabLogo: React.FC = () => <Image src="/InstructLab-LogoFile-RGB-FullColor.svg" alt="InstructLab Logo" width={256} height={256} />;

interface ChangeData {
  file: string;
  status: string;
  content?: string;
  commitSha?: string;
}

interface AlertItem {
  title: string;
  variant: AlertProps['variant'];
  key: React.Key;
}

const cloneNativeTaxonomyRepo = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/native/clone-repo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    if (response.ok) {
      console.log(result.message);
      return true;
    } else {
      console.error(result.message);
      return false;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error cloning repo:', errorMessage);
    return false;
  }
};

const DashboardNative: React.FunctionComponent = () => {
  const {
    envConfig: { taxonomyRootDir }
  } = useEnvConfig();
  const [branches, setBranches] = React.useState<{ name: string; creationDate: number; message: string; author: string }[]>([]);
  const [draftContributions, setDraftContributions] = React.useState<DraftEditFormInfo[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mergeStatus] = React.useState<{ branch: string; message: string; success: boolean } | null>(null);
  const [diffData, setDiffData] = React.useState<{ branch: string; changes: ChangeData[] } | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<{ [key: string]: boolean }>({});
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<AlertItem[]>([]);
  const [selectedBranch, setSelectedBranch] = React.useState<string | null>(null);
  const [selectedDraftContribution, setSelectedDraftContribution] = React.useState<string | null>(null);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [expandedFiles, setExpandedFiles] = React.useState<Record<string, boolean>>({});
  const [isDownloadDone, setIsDownloadDone] = React.useState<boolean>(true);

  const router = useRouter();

  const addAlert = (title: string, variant: AlertProps['variant']) => {
    const alertKey = uuidv4();
    const newAlert: AlertItem = { title, variant, key: alertKey };
    setAlerts((prevAlerts) => [...prevAlerts, newAlert]);
  };

  const removeAlert = (key: React.Key) => {
    setAlerts((prevAlerts) => prevAlerts.filter((alert) => alert.key !== key));
  };

  const addSuccessAlert = (message: string) => {
    addAlert(message, 'success');
  };

  const addDangerAlert = React.useCallback((message: string) => {
    addAlert(message, 'danger');
  }, []);

  // Fetch branches from the API route
  React.useEffect(() => {
    let refreshIntervalId: NodeJS.Timeout;

    const fetchBranches = async () => {
      const success = await cloneNativeTaxonomyRepo();
      if (success) {
        try {
          const response = await fetch('/api/native/git/branches');
          const result = await response.json();
          if (response.ok) {
            // Filter out 'main' branch
            const filteredBranches = result.branches.filter((branch: { name: string }) => branch.name !== 'main');
            setBranches(filteredBranches);
          } else {
            console.error('Failed to fetch branches:', result.error);
            addDangerAlert(result.error || 'Failed to fetch branches.');
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          addDangerAlert('Error fetching branches.');
        }
      }
    };

    cloneNativeTaxonomyRepo().then((success) => {
      if (success) {
        fetchBranches().then(() => {
          setIsLoading(false);
        });
        refreshIntervalId = setInterval(fetchBranches, 60000);
      } else {
        addDangerAlert('Failed to fetch branches.');
        setIsLoading(false);
      }
    });

    return () => clearInterval(refreshIntervalId);
  }, [addDangerAlert]);

  React.useEffect(() => {
    // Fetch all the draft contributions and mark them submitted if present in the branches
    const drafts = fetchDraftContributions().map((draft: DraftEditFormInfo) => ({
      ...draft,
      isSubmitted: branches.some((branch) => branch.name === draft.branchName)
    }));

    setDraftContributions(drafts);
  }, [branches]);

  const formatDateTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const handleShowChanges = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'diff' })
      });

      const result = await response.json();
      if (response.ok) {
        setDiffData({ branch: branchName, changes: result.changes });
        setIsChangeModalOpen(true);
      } else {
        console.error('Failed to get branch changes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching branch changes:', error);
    }
  };

  const handleDeleteContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteDraftContribution = async (branchName: string) => {
    setSelectedDraftContribution(branchName);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteContributionConfirm = async () => {
    if (selectedBranch) {
      // If draft exist in the local storage, delete it.
      if (draftContributions.find((draft) => draft.branchName == selectedBranch)) {
        deleteDraftData(selectedBranch);
      }
      await deleteContribution(selectedBranch);
      setIsDeleteModalOpen(false);
    }
    if (selectedDraftContribution) {
      //Remove draft from local storage and update the draftContributions list.
      deleteDraftData(selectedDraftContribution);

      const drafts = draftContributions.filter((item) => item.branchName != selectedDraftContribution);
      setDraftContributions(drafts);
      setIsDeleteModalOpen(false);
    }
  };

  const handleDeleteContributionCancel = () => {
    setSelectedBranch(null);
    setIsDeleteModalOpen(false);
  };

  const deleteContribution = async (branchName: string) => {
    try {
      const response = await fetch('/api/native/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'delete' })
      });

      const result = await response.json();
      if (response.ok) {
        // Remove the branch from the list
        setBranches((prevBranches) => prevBranches.filter((branch) => branch.name !== branchName));
        addSuccessAlert(result.message);
      } else {
        console.error(result.error);
        addDangerAlert(result.error);
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = 'Error deleting branch ' + branchName + ':' + error.message;
        console.error(errorMessage);
        addDangerAlert(errorMessage);
      } else {
        console.error('Unknown error deleting the contribution ${branchName}');
        addDangerAlert('Unknown error deleting the contribution ${branchName}');
      }
    }
  };

  const handleEditDraftContribution = (branchName: string) => {
    setSelectedDraftContribution(branchName);
    // Check if branchName contains string "knowledge"
    if (branchName.includes('knowledge')) {
      router.push(`/contribute/knowledge/native/${branchName}/isDraft`);
    } else {
      router.push(`/contribute/skill/native/${branchName}/isDraft`);
    }
  };

  const handleEditContribution = (branchName: string) => {
    setSelectedBranch(branchName);

    if (draftContributions.find((draft) => draft.branchName == branchName)) {
      // If user is editing the submitted contribution, use the latest data from draft.
      if (branchName.includes('knowledge')) {
        router.push(`/contribute/knowledge/native/${branchName}/isDraft`);
      } else {
        router.push(`/contribute/skill/native/${branchName}/isDraft`);
      }
    } else {
      // Check if branchName contains string "knowledge"
      if (branchName.includes('knowledge')) {
        router.push(`/contribute/knowledge/native/${branchName}`);
      } else {
        router.push(`/contribute/skill/native/${branchName}`);
      }
    }
  };

  const handlePublishContribution = async (branchName: string) => {
    setSelectedBranch(branchName);
    setIsPublishModalOpen(true);
  };

  const handlePublishContributionConfirm = async () => {
    setIsPublishing(true);
    if (selectedBranch) {
      try {
        const response = await fetch('/api/native/git/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branchName: selectedBranch, action: 'publish' })
        });

        const result = await response.json();
        if (response.ok) {
          setIsPublishing(false);
          addSuccessAlert(result.message || 'Successfully published contribution.');
          setSelectedBranch(null);
          setIsPublishModalOpen(false);
        } else {
          console.error('Failed to publish the contribution:', result.error);
          addDangerAlert(result.error || 'Failed to publish the contribution.');
        }
      } catch (error) {
        console.error('Error while publishing the contribution:', error);
        addDangerAlert(`Error while publishing the contribution: ${error}`);
      }
    } else {
      addDangerAlert('No branch selected to publish');
    }
    setIsPublishing(false);
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  const handlePublishContributionCancel = () => {
    setSelectedBranch(null);
    setIsPublishModalOpen(false);
  };

  const toggleFileContent = (filename: string) => {
    setExpandedFiles((prev) => ({
      ...prev,
      [filename]: !prev[filename]
    }));
  };

  const onActionMenuToggle = (id: string, isOpen: boolean) => {
    setIsActionMenuOpen((prevState) => ({
      ...prevState,
      [id]: isOpen
    }));
  };

  const onActionMenuSelect = (id: string) => {
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
        <AlertGroup isToast isLiveRegion>
          {alerts.map(({ key, variant, title }) => (
            <Alert
              variant={AlertVariant[variant!]}
              title={title}
              timeout={true}
              actionClose={<AlertActionCloseButton title={title as string} variantLabel={`${variant} alert`} onClose={() => removeAlert(key!)} />}
              key={key}
            />
          ))}
        </AlertGroup>

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

        {isLoading ? (
          <Spinner size="lg" />
        ) : branches.length === 0 && draftContributions.length === 0 ? (
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
                <Button variant="primary" onClick={() => router.push('/contribute/skill/')}>
                  Contribute Skill
                </Button>
                <Button variant="primary" onClick={() => router.push('/contribute/knowledge/')}>
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
                // Only display the drafts that's not submitted yet.
                !branches.find((branch) => branch.name == draft.branchName) && (
                  <GalleryItem key={draft.branchName}>
                    <Card key={draft.branchName}>
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

            {branches.map((branch) => (
              <GalleryItem key={branch.name}>
                <Card key={branch.name}>
                  <CardHeader
                    actions={{
                      actions: (
                        <Dropdown
                          onSelect={() => onActionMenuSelect(branch.name)}
                          toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <MenuToggle
                              ref={toggleRef}
                              isExpanded={isActionMenuOpen[branch.name] || false}
                              onClick={() => onActionMenuToggle(branch.name, !isActionMenuOpen[branch.name])}
                              variant="plain"
                              aria-label="contribution action menu"
                              icon={<EllipsisVIcon aria-hidden="true" />}
                            />
                          )}
                          isOpen={isActionMenuOpen[branch.name] || false}
                          onOpenChange={(isOpen: boolean) => onActionMenuToggle(branch.name, isOpen)}
                          popperProps={{ position: 'end' }}
                        >
                          <DropdownList>
                            <DropdownItem key="show-changes" onClick={() => handleShowChanges(branch.name)}>
                              Show changes
                            </DropdownItem>
                            <DropdownItem key="edit-contribution" onClick={() => handleEditContribution(branch.name)}>
                              Edit contribution
                            </DropdownItem>
                            <DropdownItem key="publish-contribution" onClick={() => handlePublishContribution(branch.name)}>
                              Publish contribution
                            </DropdownItem>
                            <DropdownItem
                              key="download-taxonomy"
                              onClick={() => {
                                setIsDownloadDone(false);
                                handleTaxonomyDownload({ branchName: branch.name, isGithubMode: false, setIsDownloadDone });
                              }}
                            >
                              Download taxonomy
                            </DropdownItem>
                            <DropdownItem key="delete-contribution" onClick={() => handleDeleteContribution(branch.name)}>
                              Delete contribution
                            </DropdownItem>
                          </DropdownList>
                        </Dropdown>
                      )
                    }}
                  >
                    <CardTitle>
                      <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
                        {draftContributions.find((draft) => draft.branchName == branch.name) && (
                          <Label icon={<PficonTemplateIcon />} color="green">
                            Draft
                          </Label>
                        )}
                        {` ${branch.message}`}
                      </Flex>
                    </CardTitle>
                  </CardHeader>
                  <CardBody>
                    <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
                      <FlexItem>Branch name: {branch.name}</FlexItem>
                      <FlexItem>Status: {draftContributions.find((draft) => draft.branchName == branch.name) ? 'Draft' : 'Open'}</FlexItem>
                      <FlexItem>Last updated: {formatDateTime(branch.creationDate)}</FlexItem>
                      <FlexItem>
                        {branch.name.includes('knowledge-contribution') ? (
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
            ))}
          </Gallery>
        )}

        {mergeStatus && (
          <PageSection hasBodyWrapper={false}>
            <p style={{ color: mergeStatus.success ? 'green' : 'red' }}>{mergeStatus.message}</p>
          </PageSection>
        )}

        <Modal
          variant={ModalVariant.medium}
          title={`Files Contained in Branch: ${diffData?.branch}`}
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          aria-labelledby="changes-contribution-modal-title"
          aria-describedby="changes-contribution-body-variant"
        >
          <ModalBody>
            {diffData?.changes.length ? (
              <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                {diffData.changes.map((change) => (
                  <li key={`${change.file}-${change.commitSha}`} style={{ marginBottom: '1rem' }}>
                    <div>
                      <strong>{change.file}</strong> - <em>{change.status}</em> - Commit SHA: {change.commitSha}
                    </div>
                    {change.status !== 'deleted' && change.content && (
                      <ExpandableSection
                        toggleText={expandedFiles[change.file] ? 'Hide file contents' : 'Show file contents'}
                        onToggle={() => toggleFileContent(change.file)}
                        isExpanded={expandedFiles[change.file] || false}
                      >
                        <pre
                          style={{
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            maxHeight: '700px',
                            overflowY: 'auto',
                            userSelect: 'text'
                          }}
                        >
                          {change.content}
                        </pre>
                      </ExpandableSection>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No differences found.</p>
            )}
          </ModalBody>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Deleting Contribution"
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          aria-labelledby="delete-contribution-modal-title"
          aria-describedby="delete-contribution-body-variant"
        >
          <ModalHeader title="Deleting Contribution" labelId="delete-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="delete-contribution-body-variant">
            <p>Are you sure you want to delete this contribution?</p>
          </ModalBody>
          <ModalFooter>
            <Button key="confirm" variant="primary" onClick={() => handleDeleteContributionConfirm()}>
              Delete
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => handleDeleteContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>

        <Modal
          variant={ModalVariant.small}
          title="Publishing Contribution"
          isOpen={isPublishModalOpen}
          onClose={() => setIsPublishModalOpen(false)}
          aria-labelledby="publish-contribution-modal-title"
          aria-describedby="publish-contribution-body-variant"
        >
          <ModalHeader title="Publishing Contribution" labelId="publish-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="publish-contribution-body-variant">
            <p>Are you sure you want to publish contribution to remote taxonomy repository present at : {taxonomyRootDir}?</p>
          </ModalBody>
          <ModalFooter>
            <Button key="confirm" variant="primary" onClick={() => handlePublishContributionConfirm()}>
              Publish {'  '}
              {isPublishing && <Spinner isInline aria-label="Publishing contribution" />}
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => handlePublishContributionCancel()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      </PageSection>
    </>
  );
};

export { DashboardNative };
