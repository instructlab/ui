import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  MenuToggle,
  MenuToggleElement,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
  Tooltip
} from '@patternfly/react-core';
import { EllipsisVIcon } from '@patternfly/react-icons';
import { ContributionInfo } from '@/types';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { handleTaxonomyDownload } from '@/utils/taxonomy';
import { deleteDraftData, TOOLTIP_FOR_DISABLE_COMPONENT, TOOLTIP_FOR_DISABLE_NEW_COMPONENT } from '@/components/Contribute/Utils/autoSaveUtils';
import ContributionChangesModal from '@/components/Dashboard/ContributionChangesModal';
import DeleteContributionModal from '@/components/Dashboard/DeleteContributionModal';

interface Props {
  contribution: ContributionInfo;
  onUpdateContributions: () => void;
  addAlert: (message: string, status: 'success' | 'danger') => void;
}

const ContributionActions: React.FC<Props> = ({ contribution, onUpdateContributions, addAlert }) => {
  const router = useRouter();
  const {
    envConfig: { taxonomyRootDir }
  } = useEnvConfig();
  const [isActionMenuOpen, setIsActionMenuOpen] = React.useState<boolean>(false);
  const [isChangeModalOpen, setIsChangeModalOpen] = React.useState<boolean>(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false);
  const changesRef = React.useRef<HTMLButtonElement>(null);
  const editRef = React.useRef<HTMLButtonElement>(null);
  const publishRef = React.useRef<HTMLButtonElement>(null);
  const downloadRef = React.useRef<HTMLButtonElement>(null);
  const deleteRef = React.useRef<HTMLButtonElement>(null);

  const handleEditContribution = () => {
    router.push(
      `/contribute/${contribution.isKnowledge ? 'knowledge' : 'skill'}/edit/${contribution.branchName}${contribution.isDraft ? '/isDraft' : ''}`
    );
  };

  const deleteContribution = async (branchName: string) => {
    try {
      const response = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName, action: 'delete' })
      });

      const result = await response.json();
      if (response.ok) {
        // Remove the branch from the list
        onUpdateContributions();
        addAlert(result.message, 'success');
      } else {
        console.error(result.error);
        addAlert(result.error, 'danger');
      }
    } catch (error) {
      if (error instanceof Error) {
        const errorMessage = 'Error deleting branch ' + branchName + ':' + error.message;
        console.error(errorMessage);
        addAlert(errorMessage, 'danger');
      } else {
        console.error(`Unknown error deleting the contribution ${branchName}`);
        addAlert(`Unknown error deleting the contribution ${branchName}`, 'danger');
      }
    }
  };

  const handleDeleteContributionConfirm = async (doDelete: boolean) => {
    if (doDelete) {
      if (contribution.isDraft) {
        deleteDraftData(contribution.branchName);
      } else {
        await deleteContribution(contribution.branchName);
      }
      onUpdateContributions();
    }
    setIsDeleteModalOpen(false);
  };

  const handlePublishContribution = async () => {
    setIsPublishing(true);
    try {
      const response = await fetch('/api/git/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchName: contribution.branchName, action: 'publish' })
      });

      const result = await response.json();
      if (response.ok) {
        setIsPublishing(false);
        addAlert(result.message || 'Successfully published contribution.', 'success');
        setIsPublishModalOpen(false);
      } else {
        console.error('Failed to publish the contribution:', result.error);
        addAlert(result.error || 'Failed to publish the contribution.', 'danger');
      }
    } catch (error) {
      console.error('Error while publishing the contribution:', error);
      addAlert(`Error while publishing the contribution: ${error}`, 'danger');
    }
    setIsPublishing(false);
    setIsPublishModalOpen(false);
  };

  const submissionDisabledTooltip = (triggerRef: React.RefObject<HTMLElement>) => (
    <Tooltip
      content={contribution.isSubmitted ? TOOLTIP_FOR_DISABLE_COMPONENT : TOOLTIP_FOR_DISABLE_NEW_COMPONENT}
      triggerRef={contribution.isDraft ? triggerRef : undefined}
      position="left"
    />
  );

  return (
    <>
      <Dropdown
        onSelect={() => setIsActionMenuOpen(false)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            isExpanded={isActionMenuOpen}
            onClick={() => setIsActionMenuOpen((prev) => !prev)}
            variant="plain"
            aria-label="contribution action menu"
            icon={<EllipsisVIcon aria-hidden="true" />}
          />
        )}
        isOpen={isActionMenuOpen}
        onOpenChange={(isOpen: boolean) => setIsActionMenuOpen(isOpen)}
        popperProps={{ position: 'end' }}
      >
        <DropdownList>
          {submissionDisabledTooltip(changesRef)}
          <DropdownItem ref={changesRef} key="show-changes" onClick={() => setIsChangeModalOpen(true)} aria-disabled={contribution.isDraft}>
            Show changes
          </DropdownItem>
          {contribution.isDraft ? (
            <DropdownItem key="edit-draft" onClick={() => handleEditContribution()}>
              Edit draft
            </DropdownItem>
          ) : null}
          {submissionDisabledTooltip(editRef)}
          <DropdownItem
            ref={editRef}
            key="edit-contribution"
            onClick={() => !contribution.isDraft && handleEditContribution()}
            aria-disabled={contribution.isDraft}
          >
            Edit contribution
          </DropdownItem>
          {submissionDisabledTooltip(publishRef)}
          <DropdownItem
            ref={publishRef}
            key="publish-contribution"
            onClick={() => !contribution.isDraft && setIsPublishModalOpen(true)}
            aria-disabled={contribution.isDraft}
          >
            Publish contribution
          </DropdownItem>
          {submissionDisabledTooltip(downloadRef)}
          <DropdownItem
            ref={downloadRef}
            key="download-taxonomy"
            onClick={() => {
              if (contribution.isDraft) {
                return;
              }
              setIsDownloadOpen(true);
              handleTaxonomyDownload({
                branchName: contribution.branchName,
                setIsDownloadDone: (done) => setIsDownloadOpen(!done)
              });
            }}
            aria-disabled={contribution.isDraft}
          >
            Download taxonomy
          </DropdownItem>
          <Divider />
          {contribution.isDraft ? (
            <DropdownItem className="destructive-action-item" key="delete-draft" onClick={() => setIsDeleteModalOpen(true)}>
              Delete draft
            </DropdownItem>
          ) : null}
          {submissionDisabledTooltip(deleteRef)}
          <DropdownItem
            className={!contribution.isDraft ? 'destructive-action-item' : undefined}
            ref={deleteRef}
            key="delete-contribution"
            onClick={() => !contribution.isDraft && setIsDeleteModalOpen(true)}
            aria-disabled={contribution.isDraft}
          >
            Delete contribution
          </DropdownItem>
        </DropdownList>
      </Dropdown>
      {isChangeModalOpen ? <ContributionChangesModal contribution={contribution} onClose={() => setIsChangeModalOpen(false)} /> : null}
      {isDeleteModalOpen ? <DeleteContributionModal contribution={contribution} onClose={handleDeleteContributionConfirm} /> : null}
      {isPublishModalOpen ? (
        <Modal
          variant={ModalVariant.small}
          isOpen
          onClose={() => setIsPublishModalOpen(false)}
          aria-labelledby="publish-contribution-modal-title"
          aria-describedby="publish-contribution-body-variant"
        >
          <ModalHeader title="Publishing Contribution" labelId="publish-contribution-modal-title" titleIconVariant="warning" />
          <ModalBody id="publish-contribution-body-variant">
            <p>Are you sure you want to publish contribution to remote taxonomy repository present at : {taxonomyRootDir}?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              key="confirm"
              variant="primary"
              onClick={() => handlePublishContribution()}
              icon={isPublishing ? <Spinner isInline aria-label="Publishing contribution" /> : undefined}
              iconPosition="right"
            >
              Publish
            </Button>
            <Button key="cancel" variant="secondary" onClick={() => setIsPublishModalOpen(false)}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
      {isDownloadOpen ? (
        <Modal variant={ModalVariant.small} title="Retrieving taxonomy tar file" isOpen onClose={() => setIsDownloadOpen(false)}>
          <ModalBody>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }}>
              <Spinner size="md" />
              Retrieving the taxonomy compressed file with the contributed data.
            </Flex>
          </ModalBody>
        </Modal>
      ) : null}
    </>
  );
};

export default ContributionActions;
