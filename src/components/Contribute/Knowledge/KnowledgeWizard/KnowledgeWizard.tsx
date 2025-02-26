// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import '../knowledge.css';
import { useSession } from 'next-auth/react';
import AuthorInformation from '@/components/Contribute/AuthorInformation';
import KnowledgeInformation from '@/components/Contribute/Knowledge/KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from '@/components/Contribute/Knowledge/FilePathInformation/FilePathInformation';
import DocumentInformation from '@/components/Contribute/Knowledge/DocumentInformation/DocumentInformation';
import SeedExamples from '@/components/Contribute/Knowledge/SeedExamples/SeedExamples';
import { ContributionFormData, KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import ReviewSubmission from '../ReviewSubmission';
import { ValidatedOptions, Button } from '@patternfly/react-core';
import { devLog } from '@/utils/devlog';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { addDocumentInfoToKnowledgeFormData } from '@/components/Contribute/Knowledge/documentUtils';
import { createEmptySeedExample } from '@/components/Contribute/Knowledge/seedExampleUtils';
import {
  isAttributionInformationValid,
  isAuthInfoValid,
  isDocumentInfoValid,
  isFilePathInfoValid,
  isKnowledgeInfoValid,
  isSeedExamplesValid
} from '@/components/Contribute/Knowledge/validationUtils';
import {
  submitGithubKnowledgeData,
  submitNativeKnowledgeData,
  updateGithubKnowledgeData,
  updateNativeKnowledgeData
} from '@/components/Contribute/Knowledge/submitUtils';
import AttributionInformation from '@/components/Contribute/Knowledge/AttributionInformation/AttributionInformation';
import { ContributionWizard, StepStatus, StepType } from '@/components/Contribute/ContributionWizard/ContributionWizard';
import { KnowledgeSchemaVersion } from '@/types/const';
import { YamlFileUploadModal } from '@/components/Contribute/YamlFileUploadModal';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import { addYamlUploadKnowledge } from '@/components/Contribute/uploadUtils';

const DefaultKnowledgeFormData: KnowledgeFormData = {
  email: '',
  name: '',
  submissionSummary: '',
  domain: '',
  documentOutline: '',
  filePath: '',
  seedExamples: [createEmptySeedExample(), createEmptySeedExample(), createEmptySeedExample(), createEmptySeedExample(), createEmptySeedExample()],
  knowledgeDocumentRepositoryUrl: '',
  knowledgeDocumentCommit: '',
  documentName: '',
  titleWork: '',
  linkWork: '',
  revision: '',
  licenseWork: '',
  creators: ''
};

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
  isGithubMode: boolean;
}

const STEP_IDS = ['author-info', 'knowledge-info', 'file-path-info', 'document-info', 'seed-examples', 'attribution-info', 'review-submission'];

export const KnowledgeWizard: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData, isGithubMode }) => {
  const { data: session } = useSession();
  const [knowledgeFormData, setKnowledgeFormData] = React.useState<KnowledgeFormData>(knowledgeEditFormData?.formData || DefaultKnowledgeFormData);
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false); // **New State Added**

  const router = useRouter();

  useEffect(() => {
    // Set all elements from the knowledgeFormData to the state
    if (knowledgeEditFormData) {
      setKnowledgeFormData({
        ...knowledgeEditFormData.formData,
        seedExamples: knowledgeEditFormData.formData.seedExamples.map((example) => ({
          ...example,
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
        }))
      });

      devLog('Seed Examples Set from Edit Form Data:', knowledgeEditFormData.formData.seedExamples);
    }
  }, [knowledgeEditFormData]);

  // Function to append document information (Updated for single repositoryUrl and commitSha)
  // Within src/components/Contribute/Native/index.tsx
  const addDocumentInfoHandler = React.useCallback(
    (repoUrl: string, commitShaValue: string, docName: string) => {
      devLog(`addDocumentInfoHandler: repoUrl=${repoUrl}, commitSha=${commitShaValue}, docName=${docName}`);
      if (knowledgeFormData.knowledgeDocumentCommit && commitShaValue !== knowledgeFormData.knowledgeDocumentCommit) {
        console.error('Cannot add documents from different commit SHAs.');
        setActionGroupAlertContent({
          title: 'Invalid Selection',
          message: 'All documents must be from the same commit SHA.',
          success: false
        });
        return;
      }
      setKnowledgeFormData((prev) => addDocumentInfoToKnowledgeFormData(prev, repoUrl, commitShaValue, docName));
    },
    [knowledgeFormData.knowledgeDocumentCommit]
  );

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  useEffect(() => {
    devLog('Seed Examples Updated:', knowledgeFormData.seedExamples);
  }, [knowledgeFormData.seedExamples]);

  const steps: StepType[] = React.useMemo(
    () => [
      {
        id: STEP_IDS[0],
        name: 'Author Information',
        component: (
          <AuthorInformation
            email={knowledgeFormData.email}
            setEmail={(email) => setKnowledgeFormData((prev) => ({ ...prev, email }))}
            name={knowledgeFormData.name}
            setName={(name) => setKnowledgeFormData((prev) => ({ ...prev, name }))}
          />
        ),
        status: isAuthInfoValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[1],
        name: 'Knowledge Information',
        component: (
          <KnowledgeInformation
            isEditForm={knowledgeEditFormData?.isEditForm}
            submissionSummary={knowledgeFormData.submissionSummary}
            setSubmissionSummary={(submissionSummary) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                submissionSummary
              }))
            }
            domain={knowledgeFormData.domain}
            setDomain={(domain) => setKnowledgeFormData((prev) => ({ ...prev, domain }))}
            documentOutline={knowledgeFormData.documentOutline}
            setDocumentOutline={(documentOutline) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                documentOutline
              }))
            }
          />
        ),
        status: isKnowledgeInfoValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[2],
        name: 'File Path Information',
        component: (
          <FilePathInformation
            path={knowledgeFormData.filePath}
            setFilePath={(filePath) => setKnowledgeFormData((prev) => ({ ...prev, filePath }))}
          />
        ),
        status: isFilePathInfoValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[3],
        name: 'Document Information',
        component: (
          <DocumentInformation
            isGithubMode={isGithubMode}
            isEditForm={knowledgeEditFormData?.isEditForm}
            knowledgeDocumentRepositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
            setKnowledgeDocumentRepositoryUrl={(knowledgeDocumentRepositoryUrl) =>
              setKnowledgeFormData((prev) => ({ ...prev, knowledgeDocumentRepositoryUrl }))
            }
            knowledgeDocumentCommit={knowledgeFormData.knowledgeDocumentCommit}
            setKnowledgeDocumentCommit={(knowledgeDocumentCommit) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                knowledgeDocumentCommit
              }))
            }
            documentName={knowledgeFormData.documentName}
            setDocumentName={(documentName) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                documentName
              }))
            }
          />
        ),
        status: isDocumentInfoValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[4],
        name: 'Seed Examples',
        component: (
          <SeedExamples
            isGithubMode={isGithubMode}
            seedExamples={knowledgeFormData.seedExamples}
            onUpdateSeedExamples={(seedExamples) => setKnowledgeFormData((prev) => ({ ...prev, seedExamples }))}
            addDocumentInfo={addDocumentInfoHandler}
            repositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
            commitSha={knowledgeFormData.knowledgeDocumentCommit}
          />
        ),
        status: isSeedExamplesValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      ...(isGithubMode
        ? [
            {
              id: STEP_IDS[5],
              name: 'Attribution Information',
              component: (
                <AttributionInformation
                  isEditForm={knowledgeEditFormData?.isEditForm}
                  knowledgeFormData={knowledgeFormData}
                  titleWork={knowledgeFormData.titleWork}
                  setTitleWork={(titleWork) => setKnowledgeFormData((prev) => ({ ...prev, titleWork }))}
                  linkWork={knowledgeFormData.linkWork}
                  setLinkWork={(linkWork) => setKnowledgeFormData((prev) => ({ ...prev, linkWork }))}
                  revision={knowledgeFormData.revision}
                  setRevision={(revision) => setKnowledgeFormData((prev) => ({ ...prev, revision }))}
                  licenseWork={knowledgeFormData.licenseWork}
                  setLicenseWork={(licenseWork) => setKnowledgeFormData((prev) => ({ ...prev, licenseWork }))}
                  creators={knowledgeFormData.creators}
                  setCreators={(creators) => setKnowledgeFormData((prev) => ({ ...prev, creators }))}
                />
              ),
              status: isAttributionInformationValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
            }
          ]
        : []),
      {
        id: STEP_IDS[6],
        name: 'Review Submission',
        component: <ReviewSubmission knowledgeFormData={knowledgeFormData} isGithubMode={isGithubMode} />,
        status: StepStatus.Default
      }
    ],
    [addDocumentInfoHandler, isGithubMode, knowledgeEditFormData?.isEditForm, knowledgeFormData]
  );

  const convertToYaml = (contributionFormData: ContributionFormData) => {
    const formData = contributionFormData as KnowledgeFormData;

    const yamlData: KnowledgeYamlData = {
      created_by: formData.email!,
      version: KnowledgeSchemaVersion,
      domain: formData.domain!,
      document_outline: formData.documentOutline!,
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
    if (knowledgeEditFormData) {
      const result = isGithubMode
        ? await updateGithubKnowledgeData(session, knowledgeFormData, knowledgeEditFormData, setActionGroupAlertContent)
        : await updateNativeKnowledgeData(knowledgeFormData, knowledgeEditFormData, setActionGroupAlertContent);
      if (result) {
        router.push('/dashboard');
      }
      return false;
    }
    const result = isGithubMode
      ? await submitGithubKnowledgeData(knowledgeFormData, githubUsername, setActionGroupAlertContent)
      : await submitNativeKnowledgeData(knowledgeFormData, setActionGroupAlertContent);
    if (result) {
      setKnowledgeFormData(DefaultKnowledgeFormData);
    }
    return result;
  };

  const onYamlUploadKnowledgeFillForm = (data: KnowledgeYamlData): void => {
    setKnowledgeFormData(addYamlUploadKnowledge(knowledgeFormData, data));
    setActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your knowledge form has been populated based on the uploaded YAML file.',
      success: true
    });
    setIsYamlModalOpen(false);
  };

  return (
    <>
      <ContributionWizard
        title="Knowledge Contribution"
        description={
          <>
            Knowledge consists of data and facts and is backed by reference documents. When you contribute knowledge, you provide the documents and a
            collection of questions and answers; this new data is used by the model to answer questions more accurately. The contribution form guides
            you through the process, or you can{' '}
            <Button isInline variant="link" onClick={() => setIsYamlModalOpen(true)}>
              upload an existing yaml file.
            </Button>
          </>
        }
        formData={knowledgeFormData}
        setFormData={(formData: ContributionFormData) => setKnowledgeFormData(formData as KnowledgeFormData)}
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
          setActionGroupAlertContent={setActionGroupAlertContent}
        />
      ) : null}
    </>
  );
};

export default KnowledgeWizard;
