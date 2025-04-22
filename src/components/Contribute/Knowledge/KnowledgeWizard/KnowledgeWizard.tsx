// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { useSession } from 'next-auth/react';
import DocumentInformation from '@/components/Contribute/Knowledge/DocumentInformation/DocumentInformation';
import KnowledgeSeedExamples from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExamples';
import { ContributionFormData, KnowledgeEditFormData, KnowledgeFormData, KnowledgeSeedExample, KnowledgeYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, ValidatedOptions } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { UploadKnowledgeDocuments } from '@/components/Contribute/Utils/documentUtils';
import {
  isDetailsValid,
  isDocumentInfoValid,
  isKnowledgeAttributionInformationValid,
  isKnowledgeSeedExamplesValid
} from '@/components/Contribute/Utils/validationUtils';
import {
  submitGithubKnowledgeData,
  submitNativeKnowledgeData,
  updateGithubKnowledgeData,
  updateNativeKnowledgeData
} from '@/components/Contribute/Utils/submitUtils';
import AttributionInformation from '@/components/Contribute/AttributionInformation/AttributionInformation';
import { ContributionWizard, StepStatus, StepType } from '@/components/Contribute/ContributionWizard/ContributionWizard';
import { KnowledgeSchemaVersion } from '@/types/const';
import { YamlFileUploadModal } from '@/components/Contribute/YamlFileUploadModal';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import { addYamlUploadKnowledge } from '@/components/Contribute/Utils/uploadUtils';
import ReviewSubmission from '@/components/Contribute/ReviewSubmission/ReviewSubmission';
import KnowledgeSeedExamplesReviewSection from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExamplesReviewSection';
import DetailsPage from '@/components/Contribute/DetailsPage/DetailsPage';
import { getDefaultKnowledgeFormData } from '@/components/Contribute/Utils/contributionUtils';
import { addDraft, deleteDraft, doSaveDraft, isDraftExist, storeDraftKnowledgeFile } from '@/components/Contribute/Utils/autoSaveUtils';

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
  isGithubMode: boolean;
}

const STEP_IDS = ['details', 'resource-documentation', 'uploaded-documents', 'attributions', 'seed-examples', 'review'];

export const KnowledgeWizard: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData, isGithubMode }) => {
  const { data: session } = useSession();
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

  async function saveKnowledgeDraft() {
    // If no change in the form data and there is no existing draft present, skip storing the draft.
    if (!doSaveDraft(knowledgeFormData) && !isDraftExist(knowledgeFormData.branchName)) return;

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
    addDraft(knowledgeFormData.branchName, draftContributionStr);
  }

  useEffect(() => {
    const storeDraft = async () => {
      await saveKnowledgeDraft();
    };
    storeDraft();
  }, [knowledgeFormData]);

  const steps: StepType[] = React.useMemo(() => {
    const documentInformationStep = {
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
    };

    return [
      {
        id: STEP_IDS[0],
        name: 'Details',
        component: (
          <DetailsPage
            isEditForm={knowledgeEditFormData?.isEditForm}
            infoSectionHelp="Knowledge contributions help a model answer questions more accurately. Knowledge data is supported by documents such as textbooks, technical manuals, journals, or magazines."
            isGithubMode={isGithubMode}
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
            rootPath="knowledge"
            filePath={knowledgeFormData.filePath}
            setFilePath={setFilePath}
          />
        ),
        status: isDetailsValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      ...(isGithubMode
        ? [
            {
              id: STEP_IDS[1],
              name: 'Data sources',
              isExpandable: true,
              subSteps: [
                documentInformationStep,
                {
                  id: STEP_IDS[3],
                  name: 'Source attribution',
                  component: (
                    <AttributionInformation
                      isEditForm={knowledgeEditFormData?.isEditForm}
                      contributionFormData={knowledgeFormData}
                      titleWork={knowledgeFormData.titleWork}
                      setTitleWork={(titleWork) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          titleWork
                        }))
                      }
                      linkWork={knowledgeFormData.linkWork}
                      setLinkWork={(linkWork) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          linkWork
                        }))
                      }
                      revision={knowledgeFormData.revision}
                      setRevision={(revision) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          revision
                        }))
                      }
                      licenseWork={knowledgeFormData.licenseWork}
                      setLicenseWork={(licenseWork) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          licenseWork
                        }))
                      }
                      creators={knowledgeFormData.creators}
                      setCreators={(creators) =>
                        setKnowledgeFormData((prev) => ({
                          ...prev,
                          creators
                        }))
                      }
                    />
                  ),
                  status: isKnowledgeAttributionInformationValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
                }
              ]
            }
          ]
        : [documentInformationStep]),
      {
        id: STEP_IDS[4],
        name: 'Create seed data',
        component: (
          <KnowledgeSeedExamples
            isGithubMode={isGithubMode}
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
        id: STEP_IDS[5],
        name: 'Review',
        component: (
          <ReviewSubmission
            isSkillContribution={false}
            contributionFormData={knowledgeFormData}
            isGithubMode={isGithubMode}
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
    ];
  }, [isGithubMode, knowledgeEditFormData?.isEditForm, knowledgeFormData, setFilePath]);

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

  const handleSubmit = async (githubUsername: string): Promise<boolean> => {
    // Upload the knowledge related documents

    const isDocUploaded = await UploadKnowledgeDocuments(isGithubMode, knowledgeFormData, updateActionGroupAlertContent);
    if (!isDocUploaded) {
      console.error('Document upload failed for knowledge contribution :', knowledgeFormData.branchName);
      return isDocUploaded;
    }

    if (knowledgeEditFormData && knowledgeEditFormData.pullRequestNumber !== 0) {
      const result = isGithubMode
        ? await updateGithubKnowledgeData(session, knowledgeFormData, knowledgeEditFormData, updateActionGroupAlertContent)
        : await updateNativeKnowledgeData(knowledgeFormData, knowledgeEditFormData, updateActionGroupAlertContent);
      if (result) {
        //Remove draft if present in the local storage
        deleteDraft(knowledgeEditFormData.formData.branchName);

        router.push('/dashboard');
      }
      return false;
    }
    const result = isGithubMode
      ? await submitGithubKnowledgeData(knowledgeFormData, githubUsername, updateActionGroupAlertContent)
      : await submitNativeKnowledgeData(knowledgeFormData, updateActionGroupAlertContent);
    if (result) {
      //Remove draft if present in the local storage
      deleteDraft(knowledgeFormData.branchName);
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
        title={knowledgeEditFormData?.formData ? 'Edit knowledge contribution' : 'Submit knowledge contribution'}
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
        isGithubMode={isGithubMode}
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
