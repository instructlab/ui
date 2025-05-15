// src/components/Contribute/Knowledge/KnowledgeWizard.tsx
'use client';
import React, { useEffect, useState } from 'react';
import DocumentInformation from '@/components/Contribute/Knowledge/KnowledgeWizard/DocumentInformation/DocumentInformation';
import KnowledgeSeedExamples from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeSeedExamples/KnowledgeSeedExamples';
import { ContributionFormData, KnowledgeEditFormData, KnowledgeFormData, KnowledgeSeedExample, KnowledgeYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import { Breadcrumb, BreadcrumbItem, Button, PageBreadcrumb, ValidatedOptions } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { UploadKnowledgeDocuments } from '@/components/Contribute/Utils/documentUtils';
import { isDetailsValid, isDocumentInfoValid, isKnowledgeSeedExamplesValid } from '@/components/Contribute/Utils/validationUtils';
import { submitKnowledgeData } from '@/components/Contribute/Utils/submitUtils';
import { ContributionWizard, StepStatus, StepType } from '@/components/Contribute/ContributionWizard/ContributionWizard';
import { KnowledgeSchemaVersion } from '@/types/const';
import { YamlFileUploadModal } from '@/components/Contribute/YamlFileUploadModal';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import { addYamlUploadKnowledge } from '@/components/Contribute/Utils/uploadUtils';
import ReviewSubmission from '@/components/Contribute/ContributionWizard/ReviewSubmission/ReviewSubmission';
import KnowledgeSeedExamplesReviewSection from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeSeedExamples/KnowledgeSeedExamplesReviewSection';
import DetailsPage from '@/components/Contribute/ContributionWizard/DetailsPage/DetailsPage';
import { getDefaultKnowledgeFormData } from '@/components/Contribute/Utils/contributionUtils';
import { storeDraftData, deleteDraftData, doSaveDraft, isDraftDataExist, storeDraftKnowledgeFile } from '@/components/Contribute/Utils/autoSaveUtils';

import './knowledge.css';

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
}

const STEP_IDS = ['details', 'resource-documentation', 'uploaded-documents', 'seed-examples', 'review'];

export const KnowledgeWizard: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData }) => {
  const [knowledgeFormData, setKnowledgeFormData] = React.useState<KnowledgeFormData>(
    knowledgeEditFormData?.formData
      ? {
          ...knowledgeEditFormData.formData,
          seedExamples: knowledgeEditFormData.formData.seedExamples.map((example, index) => ({
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
          filesToUpload: knowledgeEditFormData.formData.filesToUpload,
          uploadedFiles: knowledgeEditFormData.formData.uploadedFiles
        }
      : getDefaultKnowledgeFormData()
  );
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false); // **New State Added**

  const router = useRouter();

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const updateActionGroupAlertContent = (newContent: ActionGroupAlertContent | undefined) => {
    // In order to restart the timer, we must re-create the Alert not re-use it. Clear it for one round then set the new info
    setActionGroupAlertContent(undefined);
    if (newContent) {
      requestAnimationFrame(() => setActionGroupAlertContent(newContent));
    }
  };

  const setFilePath = React.useCallback((filePath: string) => setKnowledgeFormData((prev) => ({ ...prev, filePath })), []);

  useEffect(() => {
    const storeDraft = async () => {
      // If no change in the form data and there is no existing draft present, skip storing the draft.
      if (!doSaveDraft(knowledgeFormData) && !isDraftDataExist(knowledgeFormData.branchName)) return;

      await Promise.all(
        knowledgeFormData.filesToUpload.map(async (file) => {
          await storeDraftKnowledgeFile(knowledgeFormData.branchName, file);
        })
      );

      const draftContributionStr = JSON.stringify(knowledgeFormData, (key, value) => {
        if (key === 'filesToUpload' && Array.isArray(value)) {
          const files = value as File[];
          return files.map((v: File) => {
            return { name: v.name };
          });
        }
        return value;
      });
      storeDraftData(
        knowledgeFormData.branchName,
        knowledgeFormData.filePath,
        draftContributionStr,
        !!knowledgeEditFormData?.isSubmitted,
        knowledgeEditFormData?.oldFilesPath || ''
      );
    };
    storeDraft();
  }, [knowledgeEditFormData?.isSubmitted, knowledgeEditFormData?.oldFilesPath, knowledgeFormData]);

  const steps: StepType[] = React.useMemo(
    () => [
      {
        id: STEP_IDS[0],
        name: 'Details',
        component: (
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
        ),
        status: isDetailsValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[2],
        name: 'Upload documents',
        component: (
          <DocumentInformation
            existingFiles={knowledgeFormData.uploadedFiles}
            setExistingFiles={(files) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                uploadedFiles: files
              }))
            }
            filesToUpload={knowledgeFormData.filesToUpload}
            setFilesToUpload={(files) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                filesToUpload: files
              }))
            }
          />
        ),
        status: isDocumentInfoValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[3],
        name: 'Create seed data',
        component: (
          <KnowledgeSeedExamples
            filesToUpload={knowledgeFormData.filesToUpload}
            uploadedFiles={knowledgeFormData.uploadedFiles}
            seedExamples={knowledgeFormData.seedExamples}
            onUpdateSeedExamples={(seedExamples) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                seedExamples
              }))
            }
          />
        ),
        status: isKnowledgeSeedExamplesValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[4],
        name: 'Review',
        component: (
          <ReviewSubmission
            isSkillContribution={false}
            contributionFormData={knowledgeFormData}
            seedExamples={<KnowledgeSeedExamplesReviewSection seedExamples={knowledgeFormData.seedExamples} />}
            onUpdateSeedExamples={(seedExamples) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                seedExamples: seedExamples as KnowledgeSeedExample[]
              }))
            }
          />
        ),
        status: StepStatus.Default
      }
    ],
    [knowledgeEditFormData?.isEditForm, knowledgeFormData, setFilePath]
  );

  const convertToYaml = (contributionFormData: ContributionFormData) => {
    const formData = contributionFormData as KnowledgeFormData;

    const yamlData: KnowledgeYamlData = {
      created_by: formData.email!,
      version: KnowledgeSchemaVersion,
      domain: formData.filePath,
      document_outline: formData.submissionSummary,
      seed_examples: formData.seedExamples.map((example) => ({
        context: example.context!,
        questions_and_answers: example.questionAndAnswers.map((qa) => ({
          question: qa.question,
          answer: qa.answer
        }))
      })),
      document: {
        repo: formData.knowledgeDocumentRepositoryUrl!,
        commit: formData.knowledgeDocumentCommit!,
        patterns: formData.documentName!.split(',').map((pattern) => pattern.trim())
      }
    };
    return yamlData;
  };

  const handleSubmit = async (): Promise<boolean> => {
    // Upload the knowledge related documents

    const isDocUploaded = await UploadKnowledgeDocuments(knowledgeFormData, updateActionGroupAlertContent);
    if (!isDocUploaded) {
      console.error('Document upload failed for knowledge contribution :', knowledgeFormData.branchName);
      return isDocUploaded;
    }

    const result = await submitKnowledgeData(
      knowledgeFormData,
      updateActionGroupAlertContent,
      knowledgeEditFormData?.isSubmitted ? knowledgeEditFormData : undefined
    );
    if (result) {
      //Remove draft if present in the local storage
      deleteDraftData(knowledgeFormData.branchName);
      router.push('/dashboard');
    }
    return result;
  };

  const onYamlUploadKnowledgeFillForm = (data: KnowledgeYamlData): void => {
    setKnowledgeFormData(addYamlUploadKnowledge(knowledgeFormData, data));
    updateActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your knowledge form has been populated based on the uploaded YAML file.',
      success: true
    });
    setIsYamlModalOpen(false);
  };

  return (
    <>
      <ContributionWizard
        breadcrumbs={
          knowledgeEditFormData ? (
            <PageBreadcrumb stickyOnBreakpoint={{ default: 'top' }}>
              <Breadcrumb>
                <BreadcrumbItem
                  to="/"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/dashboard');
                  }}
                >
                  My contributions
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{`Edit${knowledgeEditFormData?.isDraft ? ' draft' : ''} knowledge contribution`}</BreadcrumbItem>
              </Breadcrumb>
            </PageBreadcrumb>
          ) : null
        }
        title={
          knowledgeEditFormData?.formData ? `Edit${knowledgeEditFormData?.isDraft ? ' draft' : ''} knowledge contribution` : 'Knowledge contribution'
        }
        description={
          <>
            Knowledge contributions improve a model’s ability to answer questions accurately. They consist of questions and answers, and documents
            which back up that data. To autofill this form from a document,{' '}
            <Button isInline variant="link" onClick={() => setIsYamlModalOpen(true)}>
              upload a YAML file.
            </Button>
          </>
        }
        formData={knowledgeFormData}
        setFormData={setKnowledgeFormData as React.Dispatch<React.SetStateAction<ContributionFormData>>}
        isSkillContribution={false}
        steps={steps}
        convertToYaml={convertToYaml}
        onSubmit={handleSubmit}
      />
      <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={onCloseActionGroupAlert} />
      {isYamlModalOpen ? (
        <YamlFileUploadModal
          onClose={() => setIsYamlModalOpen(false)}
          isKnowledgeForm={true}
          onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
          setActionGroupAlertContent={updateActionGroupAlertContent}
        />
      ) : null}
    </>
  );
};

export default KnowledgeWizard;
