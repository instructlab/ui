// src/components/Contribute/Skill/SkillFOrmActions.tsx
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  ButtonVariant,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  MenuToggleElement,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  ModalVariant,
  Spinner,
  Tooltip
} from '@patternfly/react-core';
import { AngleDownIcon } from '@patternfly/react-icons';
import { SkillFormData, SkillYamlData } from '@/types';
import { SkillSchemaVersion } from '@/types/const';
import { useEnvConfig } from '@/context/EnvConfigContext';
import { useAlerts } from '@/context/AlertContext';
import { dumpYaml } from '@/utils/yamlConfig';
import YamlCodeModal from '@/components/YamlCodeModal';
import { YamlFileUploadModal } from '@/components/Contribute/YamlFileUploadModal';
import { addYamlUploadSkill } from '@/components/Contribute/Utils/uploadUtils';
import { deleteDraftData, TOOLTIP_FOR_DISABLE_COMPONENT, TOOLTIP_FOR_DISABLE_NEW_COMPONENT } from '@/components/Contribute/Utils/autoSaveUtils';
import { getAutoFillSkillsFields } from '@/components/Contribute/AutoFill';
import { handleTaxonomyDownload } from '@/utils/taxonomy';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import DeleteContributionModal from '@/components/Dashboard/DeleteContributionModal';

export interface Props {
  contributionTitle: string;
  skillFormData: SkillFormData;
  isDraft?: boolean;
  isSubmitted?: boolean;
  setActionGroupAlertContent: (content: ActionGroupAlertContent | undefined) => void;
  setSkillFormData?: (formData: SkillFormData) => void;
}

export const SkillFormActions: React.FunctionComponent<Props> = ({
  contributionTitle,
  skillFormData,
  isDraft,
  isSubmitted,
  setActionGroupAlertContent,
  setSkillFormData
}) => {
  const router = useRouter();
  const {
    envConfig: { isDevMode }
  } = useEnvConfig();
  const { addAlert } = useAlerts();
  const [isActionsOpen, setIsActionsOpen] = React.useState<boolean>(false);
  const deleteRef = React.useRef<HTMLButtonElement>(null);
  const downloadRef = React.useRef<HTMLButtonElement>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [isDownloadOpen, setIsDownloadOpen] = React.useState(false);
  const [isYamlModalOpen, setIsYamlModalOpen] = React.useState<boolean>(false);
  const [yamlModalContent, setYamlModalContent] = React.useState<string>('');
  const [isUploadYamlModalOpen, setIsUploadYamlModalOpen] = React.useState<boolean>(false);
  const [yamlOverwriteData, setYamlOverwriteData] = React.useState<SkillYamlData>();

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
        addAlert(result.message, 'success');
        router.push('/dashboard');
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
      if (isDraft) {
        deleteDraftData(skillFormData.branchName);
      } else if (isSubmitted) {
        await deleteContribution(skillFormData.branchName);
      }
    }
    setIsDeleteModalOpen(false);
    router.push('/dashboard');
  };

  const convertToYaml = (formData: SkillFormData) => {
    const yamlData: SkillYamlData = {
      created_by: formData.email!,
      version: SkillSchemaVersion,
      task_description: skillFormData.submissionSummary,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.questionAndAnswer.question,
        answer: example.questionAndAnswer.answer
      }))
    };
    return yamlData;
  };

  const handleViewYaml = () => {
    const yamlData = convertToYaml(skillFormData);
    const yamlString = dumpYaml(yamlData);
    setYamlModalContent(yamlString);
    setIsYamlModalOpen(true);
  };

  const handleSaveYaml = () => {
    const yamlData = convertToYaml(skillFormData);
    const yamlString = dumpYaml(yamlData);
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qna.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const doYamlOverwrite = () => {
    if (yamlOverwriteData && setSkillFormData) {
      setSkillFormData(addYamlUploadSkill(skillFormData, yamlOverwriteData));
      addAlert('Your skill form has been populated based on the uploaded YAML file.', 'success');
      setYamlOverwriteData(undefined);
    }
  };

  const onYamlUploadSkillFillForm = (data: SkillYamlData): void => {
    if (!setSkillFormData) {
      return;
    }

    setIsYamlModalOpen(false);

    if (isSubmitted) {
      setYamlOverwriteData(data);
      return;
    }

    setSkillFormData(addYamlUploadSkill(skillFormData, data));
    addAlert('Your skill form has been populated based on the uploaded YAML file.', 'success');
  };

  const autoFillForm = (): void => {
    if (!setSkillFormData) {
      return;
    }
    const autoFillData = getAutoFillSkillsFields();
    const formData: SkillFormData = {
      ...skillFormData,
      seedExamples: autoFillData.seedExamples,
      submissionSummary: autoFillData.submissionSummary,
      titleWork: autoFillData.titleWork,
      licenseWork: autoFillData.licenseWork,
      creators: autoFillData.creators,
      filePath: autoFillData.filePath
    };
    setSkillFormData(formData);
  };

  const submissionDisabledTooltip = (triggerRef: React.RefObject<HTMLElement>) => (
    <Tooltip
      content={isSubmitted ? TOOLTIP_FOR_DISABLE_COMPONENT : TOOLTIP_FOR_DISABLE_NEW_COMPONENT}
      triggerRef={isDraft ? triggerRef : undefined}
      position="left"
    />
  );

  return (
    <>
      <Dropdown
        isOpen={isActionsOpen}
        onSelect={() => setIsActionsOpen(false)}
        onOpenChange={(isOpen: boolean) => setIsActionsOpen(isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <Button ref={toggleRef} variant="secondary" icon={<AngleDownIcon />} onClick={() => setIsActionsOpen((prev) => !prev)} iconPosition="right">
            Actions
          </Button>
        )}
        popperProps={{ position: 'right' }}
        shouldFocusToggleOnSelect
      >
        <DropdownList>
          {isDevMode && setSkillFormData ? <DropdownItem onClick={autoFillForm}>Autofill</DropdownItem> : null}
          {!setSkillFormData ? (
            <DropdownItem onClick={() => router.push(`/contribute/skill/edit/${skillFormData.branchName}${isDraft ? '/isDraft' : ''}`)}>
              Edit contribution
            </DropdownItem>
          ) : null}
          {setSkillFormData ? <DropdownItem onClick={() => setIsUploadYamlModalOpen(true)}>Upload YAML</DropdownItem> : null}
          <DropdownItem onClick={() => handleViewYaml()}>View YAML</DropdownItem>
          {isSubmitted ? (
            <>
              {submissionDisabledTooltip(downloadRef)}
              <DropdownItem
                ref={downloadRef}
                key="download-taxonomy"
                onClick={() => {
                  if (isDraft) {
                    return;
                  }
                  setIsDownloadOpen(true);
                  handleTaxonomyDownload({
                    branchName: skillFormData.branchName,
                    setIsDownloadDone: (done) => setIsDownloadOpen(!done)
                  });
                }}
                aria-disabled={isDraft}
              >
                Download taxonomy
              </DropdownItem>
              <Divider component="li" />
              {isDraft ? (
                <DropdownItem className="destructive-action-item" key="delete-draft" onClick={() => setIsDeleteModalOpen(true)}>
                  Delete draft
                </DropdownItem>
              ) : null}
              {submissionDisabledTooltip(deleteRef)}
              <DropdownItem
                className={!isDraft ? 'destructive-action-item' : undefined}
                ref={deleteRef}
                key="delete-contribution"
                onClick={() => !isDraft && setIsDeleteModalOpen(true)}
                aria-disabled={isDraft}
              >
                Delete contribution
              </DropdownItem>
            </>
          ) : null}
        </DropdownList>
      </Dropdown>
      {isYamlModalOpen ? (
        <YamlCodeModal handleModalToggle={() => setIsYamlModalOpen(!isYamlModalOpen)} yamlContent={yamlModalContent} onSave={handleSaveYaml} />
      ) : null}
      {isUploadYamlModalOpen ? (
        <YamlFileUploadModal
          onClose={() => setIsUploadYamlModalOpen(false)}
          isKnowledgeForm={true}
          onYamlUploadSkillsFillForm={onYamlUploadSkillFillForm}
          setActionGroupAlertContent={setActionGroupAlertContent}
        />
      ) : null}
      {isDeleteModalOpen ? (
        <DeleteContributionModal title={skillFormData.submissionSummary} isDraft={isDraft || false} onClose={handleDeleteContributionConfirm} />
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
      {yamlOverwriteData ? (
        <Modal variant={ModalVariant.small} isOpen onClose={() => setYamlOverwriteData(undefined)} aria-labelledby="overwrite-confirm-title">
          <ModalHeader titleIconVariant="warning" title="Overwrite unsaved changes?" labelId="overwrite-confirm-title" />
          <ModalBody>
            <>
              Uploading a YAML file will overwrite all unsaved changes in the <strong>{contributionTitle}</strong> skill contribution.
            </>
          </ModalBody>
          <ModalFooter>
            <Button variant={ButtonVariant.primary} onClick={doYamlOverwrite}>
              Overwrite unsaved changes
            </Button>
            <Button key="close" variant="link" onClick={doYamlOverwrite}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </>
  );
};

export default SkillFormActions;
