// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { useSession } from 'next-auth/react';
import DocumentInformation from '@/components/Contribute/Knowledge/DocumentInformation/DocumentInformation';
import KnowledgeSeedExamples from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExamples';
import { ContributionFormData, KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import { Button, ValidatedOptions } from '@patternfly/react-core';
import { devLog } from '@/utils/devlog';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { addDocumentInfoToKnowledgeFormData } from '@/components/Contribute/Utils/documentUtils';
import {
  isKnowledgeDetailsValid,
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
import { createDefaultKnowledgeSeedExamples } from '@/components/Contribute/Utils/seedExampleUtils';
import KnowledgeSeedExamplesReviewSection from '@/components/Contribute/Knowledge/KnowledgeSeedExamples/KnowledgeSeedExamplesReviewSection';
import DetailsPage from '@/components/Contribute/DetailsPage/DetailsPage';

const GITHUB_GIT_INFO_URL = '/api/github/git-info';
const NATIVE_GIT_INFO_URL = '/api/native/git/info';

const DefaultKnowledgeFormData: KnowledgeFormData = {
  email: '',
  name: '',
  submissionSummary: '',
  domain: '',
  documentOutline: '',
  filePath: '',
  seedExamples: createDefaultKnowledgeSeedExamples(),
  knowledgeDocumentRepositoryUrl: '',
  knowledgeDocumentCommit: '',
  documentName: '',
  titleWork: '',
  linkWork: '',
  revision: '',
  licenseWork: '',
  creators: '',
  filesToUpload: []
};

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
          })),
          filesToUpload: []
        }
      : DefaultKnowledgeFormData
  );
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false); // **New State Added**

  const router = useRouter();

  React.useEffect(() => {
    let canceled = false;
    const fetchInfo = async () => {
      const response = await fetch(isGithubMode ? GITHUB_GIT_INFO_URL : NATIVE_GIT_INFO_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!canceled && (response.status === 201 || response.ok)) {
        const result = await response.json();
        setKnowledgeFormData((prev) => ({
          ...prev,
          knowledgeDocumentRepositoryUrl: result.repoUrl,
          knowledgeDocumentCommit: result.commitSha,
          documentName: result.fileNames
        }));
      }
    };

    if (!knowledgeEditFormData?.isEditForm) {
      fetchInfo();
    }

    return () => {
      canceled = true;
    };
  }, [isGithubMode, knowledgeEditFormData?.isEditForm]);

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

  const setFilePath = React.useCallback((filePath: string) => setKnowledgeFormData((prev) => ({ ...prev, filePath })), []);

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  useEffect(() => {
    devLog('Seed Examples Updated:', knowledgeFormData.seedExamples);
  }, [knowledgeFormData.seedExamples]);

  const steps: StepType[] = React.useMemo(() => {
    const documentInformationStep = {
      id: STEP_IDS[2],
      name: 'Upload documents',
      component: (
        <DocumentInformation
          isGithubMode={isGithubMode}
          setKnowledgeDocumentRepositoryUrl={(knowledgeDocumentRepositoryUrl) =>
            setKnowledgeFormData((prev) => ({ ...prev, knowledgeDocumentRepositoryUrl }))
          }
          setKnowledgeDocumentCommit={(knowledgeDocumentCommit) =>
            setKnowledgeFormData((prev) => ({
              ...prev,
              knowledgeDocumentCommit
            }))
          }
          setDocumentName={(documentName) =>
            setKnowledgeFormData((prev) => ({
              ...prev,
              documentName
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
            infoSectionTitle="Knowledge information"
            infoSectionHelp="Contributing knowledge provides a model with additional data to more accurately answer questions. Knowledge is supported by documents, such as a textbook, technical manual, encyclopedia, journal, or magazine."
            infoSectionDescription="Provide brief information about the knowledge."
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
            domain={knowledgeFormData.domain}
            setDomain={(domain) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                domain
              }))
            }
            documentOutline={knowledgeFormData.documentOutline}
            setDocumentOutline={(documentOutline) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                documentOutline
              }))
            }
            rootPath="knowledge"
            filePath={knowledgeFormData.filePath}
            setFilePath={setFilePath}
          />
        ),
        status: isKnowledgeDetailsValid(knowledgeFormData) ? StepStatus.Success : StepStatus.Error
      },
      ...(isGithubMode
        ? [
            {
              id: STEP_IDS[1],
              name: 'Resource documentation',
              isExpandable: true,
              subSteps: [
                documentInformationStep,
                {
                  id: STEP_IDS[3],
                  name: 'Attribution details',
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
        name: 'Seed Examples',
        component: (
          <KnowledgeSeedExamples
            isGithubMode={isGithubMode}
            seedExamples={knowledgeFormData.seedExamples}
            onUpdateSeedExamples={(seedExamples) =>
              setKnowledgeFormData((prev) => ({
                ...prev,
                seedExamples
              }))
            }
            addDocumentInfo={addDocumentInfoHandler}
            repositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
            commitSha={knowledgeFormData.knowledgeDocumentCommit}
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
          />
        ),
        status: StepStatus.Default
      }
    ];
  }, [addDocumentInfoHandler, isGithubMode, knowledgeEditFormData?.isEditForm, knowledgeFormData, setFilePath]);

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
      const newFormData = { ...DefaultKnowledgeFormData };
      newFormData.name = knowledgeFormData.name;
      newFormData.email = knowledgeFormData.email;
      setKnowledgeFormData(newFormData);
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
          setActionGroupAlertContent={setActionGroupAlertContent}
        />
      ) : null}
    </>
  );
};

export default KnowledgeWizard;
