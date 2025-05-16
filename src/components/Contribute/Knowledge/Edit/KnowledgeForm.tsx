// src/components/Contribute/Knowledge/Edit/KnowledgeForm.tsx
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  ButtonVariant,
  Divider,
  Flex,
  FlexItem,
  PageGroup,
  PageSection,
  ValidatedOptions
} from '@patternfly/react-core';
import { KnowledgeEditFormData, KnowledgeFormData } from '@/types';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import KnowledgeContributionSidePanelHelp from '@/components/SidePanelContents/KnowledgeContributionSidePanelHelp';
import ContributePageHeader from '@/components/Contribute/ContributePageHeader';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import { storeDraftData, deleteDraftData, formDataChanged, isDraftDataExist } from '@/components/Contribute/Utils/autoSaveUtils';
import { getDefaultKnowledgeFormData } from '@/components/Contribute/Utils/contributionUtils';
import { UploadKnowledgeDocuments } from '@/components/Contribute/Utils/documentUtils';
import { submitKnowledgeData } from '@/components/Contribute/Utils/submitUtils';
import { isDetailsValid, isKnowledgeSeedExamplesValid } from '@/components/Contribute/Utils/validationUtils';
import DetailsPage from '@/components/Contribute/DetailsPage/DetailsPage';
import KnowledgeFormActions from '@/components/Contribute/Knowledge/KnowledgeFormActions';
import KnowledgeSeedExamples from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExamples';

import '../knowledge.css';

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
  draftData?: KnowledgeFormData;
}

export const KnowledgeForm: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData, draftData }) => {
  const router = useRouter();

  const { data: session } = useSession();
  const currentData: KnowledgeFormData | undefined = draftData || knowledgeEditFormData?.formData;
  const [knowledgeFormData, setKnowledgeFormData] = React.useState<KnowledgeFormData>(
    currentData
      ? {
          ...currentData,
          seedExamples: currentData.seedExamples.map((example, index) => ({
            ...example,
            isExpanded: index === 0,
            immutable: example.immutable !== undefined ? example.immutable : true, // Ensure immutable is set
            isContextValid: example.isContextValid || ValidatedOptions.default,
            validationError: example.validationError || '',
            questionAndAnswers: example.questionAndAnswers.map((qa) => ({
              ...qa,
              immutable: qa.immutable !== undefined ? qa.immutable : true, // Ensure immutable is set
              isQuestionValid: qa.isQuestionValid || ValidatedOptions.default,
              questionValidationError: qa.questionValidationError || '',
              isAnswerValid: qa.isAnswerValid || ValidatedOptions.default,
              answerValidationError: qa.answerValidationError || ''
            }))
          })),
          uploadedFiles: currentData.uploadedFiles
        }
      : getDefaultKnowledgeFormData()
  );
  const lastUpdateRef = React.useRef<string>(JSON.stringify(knowledgeFormData));

  const [actionGroupAlertContent, setActionGroupAlertContent] = React.useState<ActionGroupAlertContent | undefined>();
  const [scrollableRef, setScrollableRef] = React.useState<HTMLElement | null>();

  const isValid = isDetailsValid(knowledgeFormData) && isKnowledgeSeedExamplesValid(knowledgeFormData);

  React.useEffect(() => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      name: session?.user?.name ? session.user.name : prev.name,
      email: session?.user?.email ? session.user.email : prev.email
    }));
  }, [session?.accessToken, session?.user?.name, session?.user?.email, setKnowledgeFormData]);

  const setFilePath = React.useCallback((filePath: string) => setKnowledgeFormData((prev) => ({ ...prev, filePath })), []);

  React.useEffect(() => {
    const storeDraft = () => {
      if (isDraftDataExist(knowledgeFormData.branchName) && !formDataChanged(knowledgeFormData, knowledgeEditFormData?.formData)) {
        deleteDraftData(knowledgeFormData.branchName);
        lastUpdateRef.current = JSON.stringify(knowledgeFormData);
        return;
      }

      const draftChanges = formDataChanged(knowledgeFormData, JSON.parse(lastUpdateRef.current));
      if (draftChanges) {
        const draftContributionStr = JSON.stringify(knowledgeFormData);
        lastUpdateRef.current = draftContributionStr;
        storeDraftData(knowledgeFormData.branchName, knowledgeFormData.filePath, draftContributionStr, knowledgeEditFormData?.oldFilesPath || '');
      }
    };

    storeDraft();
  }, [knowledgeEditFormData?.formData, knowledgeEditFormData?.oldFilesPath, knowledgeFormData]);

  const updateActionGroupAlertContent = (newContent: ActionGroupAlertContent | undefined) => {
    // In order to restart the timer, we must re-create the Alert not re-use it. Clear it for one round then set the new info
    setActionGroupAlertContent(undefined);
    if (newContent) {
      requestAnimationFrame(() => setActionGroupAlertContent(newContent));
    }
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const handleSubmit = async (): Promise<boolean> => {
    // Upload the knowledge related documents

    const isDocUploaded = await UploadKnowledgeDocuments(knowledgeFormData, updateActionGroupAlertContent);
    if (!isDocUploaded) {
      console.error('Document upload failed for knowledge contribution :', knowledgeFormData.branchName);
      return isDocUploaded;
    }

    const result = await submitKnowledgeData(knowledgeFormData, updateActionGroupAlertContent, knowledgeEditFormData);
    if (result) {
      //Remove draft if present in the local storage
      deleteDraftData(knowledgeFormData.branchName);
      router.push('/dashboard');
    }
    return result;
  };

  return (
    <>
      <PageGroup isFilled style={{ overflowY: 'hidden', flex: 1 }}>
        <ContributePageHeader
          isEdit
          editFormData={knowledgeEditFormData}
          draftData={draftData}
          description="Knowledge contributions improve a model’s ability to answer questions accurately. They consist of questions and answers, and documents
                which back up that data. To autofill this form from a document, upload a YAML file."
          sidePanelContent={<KnowledgeContributionSidePanelHelp />}
          helpText="Learn more about knowledge contributions"
          actions={
            <KnowledgeFormActions
              contributionTitle={knowledgeEditFormData?.formData.submissionSummary ?? 'New contribution'}
              knowledgeFormData={knowledgeFormData}
              isDraft={!!draftData}
              isSubmitted={!!knowledgeEditFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              setKnowledgeFormData={setKnowledgeFormData}
            />
          }
        />
        <div className="knowledge-form">
          <PageSection ref={setScrollableRef} isFilled>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} flexWrap={{ default: 'nowrap' }}>
              <FlexItem>
                <DetailsPage
                  isEditForm={knowledgeEditFormData?.isEditForm}
                  infoSectionHelp="Knowledge contributions help a model answer questions more accurately. Knowledge data is supported by documents such as textbooks, technical manuals, journals, or magazines."
                  email={knowledgeFormData.email}
                  setEmail={(email) => setKnowledgeFormData((prev) => ({ ...prev, email }))}
                  name={knowledgeFormData.name}
                  setName={(name) => setKnowledgeFormData((prev) => ({ ...prev, name }))}
                  submissionSummary={knowledgeFormData.submissionSummary}
                  setSubmissionSummary={(submissionSummary) =>
                    setKnowledgeFormData((prev) => ({
                      ...prev,
                      submissionSummary
                    }))
                  }
                  submissionSummaryPlaceholder="Describe the main idea or information this example teaches (e.g., defining a scientific term, explaining a historical event)."
                  rootPath="knowledge"
                  filePath={knowledgeFormData.filePath}
                  setFilePath={setFilePath}
                />
              </FlexItem>
              <FlexItem>
                <KnowledgeSeedExamples
                  scrollable={scrollableRef || null}
                  uploadedFiles={knowledgeFormData.uploadedFiles}
                  seedExamples={knowledgeFormData.seedExamples}
                  onUpdateSeedExamples={(seedExamples) =>
                    setKnowledgeFormData((prev) => ({
                      ...prev,
                      seedExamples
                    }))
                  }
                />
              </FlexItem>
            </Flex>
          </PageSection>
        </div>
        <Divider />
        <PageSection>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button variant={ButtonVariant.primary} type="submit" isDisabled={!isValid} onClick={() => isValid && handleSubmit()}>
                  {knowledgeEditFormData ? 'Update' : 'Submit'}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant={ButtonVariant.link} onClick={() => router.push('/dashboard')}>
                  Cancel
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </PageSection>
        <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={onCloseActionGroupAlert} />
      </PageGroup>
    </>
  );
};

export default KnowledgeForm;
