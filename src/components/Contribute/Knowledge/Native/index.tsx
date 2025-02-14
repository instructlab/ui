// src/components/Contribute/Native/Knowledge/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import '../knowledge.css';
import { useSession } from 'next-auth/react';
import AuthorInformation from '@/components/Contribute/AuthorInformation';
import KnowledgeInformation from '@/components/Contribute/Knowledge/KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from '@/components/Contribute/Knowledge/FilePathInformation/FilePathInformation';
import DocumentInformation from '@/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation';
import KnowledgeSeedExampleNative from '@/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeSeedExampleNative';
import { KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import { autoFillKnowledgeFields } from '@/components/Contribute/Knowledge/AutoFill';
import ReviewSubmission from '../ReviewSubmission';
import { YamlFileUploadModal } from '../../YamlFileUploadModal';
import {
  ValidatedOptions,
  PageGroup,
  PageBreadcrumb,
  Breadcrumb,
  BreadcrumbItem,
  PageSection,
  Flex,
  FlexItem,
  Title,
  Button,
  Content,
  Wizard,
  WizardStep
} from '@patternfly/react-core';
import { devLog } from '@/utils/devlog';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import KnowledgeWizardFooter from '@/components/Contribute/Knowledge/Native/KnowledgeWizardFooter';
import { addDocumentInfoToKnowledgeFormData } from '@/components/Contribute/documentUtils';
import { addYamlUploadKnowledge } from '@/components/Contribute/uploadUtils';
import {
  createEmptySeedExample,
  handleSeedExamplesAnswerBlur,
  handleSeedExamplesAnswerInputChange,
  handleSeedExamplesContextBlur,
  handleSeedExamplesContextInputChange,
  handleSeedExamplesQuestionBlur,
  handleSeedExamplesQuestionInputChange,
  toggleSeedExamplesExpansion
} from '@/components/Contribute/seedExampleUtils';
import {
  isAuthInfoValid,
  isDocumentInfoValid,
  isFilePathInfoValid,
  isKnowledgeInfoValid,
  isSeedExamplesValid
} from '@/components/Contribute/validationUtils';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import { submitNativeKnowledgeData } from '@/components/Contribute/submitUtils';

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
}

const STEP_IDS = ['author-info', 'knowledge-info', 'file-path-info', 'document-info', 'seed-examples', 'review-submission'];

export const KnowledgeFormNative: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData }) => {
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | undefined>();
  const { data: session } = useSession();
  const [knowledgeFormData, setKnowledgeFormData] = React.useState<KnowledgeFormData>(
    knowledgeEditFormData?.knowledgeFormData || DefaultKnowledgeFormData
  );
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false); // **New State Added**
  const [submitEnabled, setSubmitEnabled] = useState<boolean>(false); // **New State Added**
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);

  const router = useRouter();

  useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDevModeEnabled(envConfig.ENABLE_DEV_MODE === 'true');
    };
    getEnvVariables();
  }, []);

  useEffect(() => {
    if (session?.user?.name && session?.user?.email) {
      setKnowledgeFormData((prev) => ({ ...prev, name: session?.user?.name || '', email: session?.user?.email || '' }));
    }
  }, [session?.user]);

  useEffect(() => {
    // Set all elements from the knowledgeFormData to the state
    if (knowledgeEditFormData) {
      setKnowledgeFormData({
        ...knowledgeEditFormData.knowledgeFormData,
        seedExamples: knowledgeEditFormData.knowledgeFormData.seedExamples.map((example) => ({
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

      devLog('Seed Examples Set from Edit Form Data:', knowledgeEditFormData.knowledgeFormData.seedExamples);
    }
  }, [knowledgeEditFormData]);

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: handleSeedExamplesContextInputChange(prev.seedExamples, seedExampleIndex, contextValue)
    }));
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: handleSeedExamplesContextBlur(prev.seedExamples, seedExampleIndex)
    }));
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: handleSeedExamplesQuestionInputChange(prev.seedExamples, seedExampleIndex, questionAndAnswerIndex, questionValue)
    }));
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: handleSeedExamplesQuestionBlur(prev.seedExamples, seedExampleIndex, questionAndAnswerIndex)
    }));
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: handleSeedExamplesAnswerInputChange(prev.seedExamples, seedExampleIndex, questionAndAnswerIndex, answerValue)
    }));
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: handleSeedExamplesAnswerBlur(prev.seedExamples, seedExampleIndex, questionAndAnswerIndex)
    }));
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    setKnowledgeFormData((prev) => ({
      ...prev,
      seedExamples: toggleSeedExamplesExpansion(prev.seedExamples, index)
    }));
  };

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

  const addSeedExample = (): void => {
    const seedExample = createEmptySeedExample();
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    setKnowledgeFormData((prev) => ({ ...prev, seedExamples: [...prev.seedExamples, seedExample] }));
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    setKnowledgeFormData((prev) => ({ ...prev, seedExamples: prev.seedExamples.filter((_, index: number) => index !== seedExampleIndex) }));
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const autoFillForm = (): void => {
    setKnowledgeFormData({
      ...autoFillKnowledgeFields,
      knowledgeDocumentRepositoryUrl: '~/.instructlab-ui/taxonomy-knowledge-docs'
    });
  };
  const onYamlUploadKnowledgeFillForm = (data: KnowledgeYamlData): void => {
    setKnowledgeFormData((prev) => addYamlUploadKnowledge(prev, data));
    setActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your knowledge form has been populated based on the uploaded YAML file.',
      success: true
    });
  };

  useEffect(() => {
    devLog('Seed Examples Updated:', knowledgeFormData.seedExamples);
  }, [knowledgeFormData.seedExamples]);

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const steps: { id: string; name: string; component: React.ReactNode; status?: 'default' | 'error' }[] = React.useMemo(
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
        status: isAuthInfoValid(knowledgeFormData) ? 'default' : 'error'
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
        status: isKnowledgeInfoValid(knowledgeFormData) ? 'default' : 'error'
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
        status: isFilePathInfoValid(knowledgeFormData) ? 'default' : 'error'
      },
      {
        id: STEP_IDS[3],
        name: 'Document Information',
        component: (
          <DocumentInformation
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
        status: isDocumentInfoValid(knowledgeFormData) ? 'default' : 'error'
      },
      {
        id: STEP_IDS[4],
        name: 'Seed Examples',
        component: (
          <KnowledgeSeedExampleNative
            seedExamples={knowledgeFormData.seedExamples}
            handleContextInputChange={(idx, val) => {
              handleContextInputChange(idx, val);
            }}
            handleContextBlur={(idx) => {
              handleContextBlur(idx);
            }}
            handleQuestionInputChange={(sIdx, qaIdx, val) => {
              handleQuestionInputChange(sIdx, qaIdx, val);
            }}
            handleQuestionBlur={(sIdx, qaIdx) => {
              handleQuestionBlur(sIdx, qaIdx);
            }}
            handleAnswerInputChange={(sIdx, qaIdx, val) => {
              handleAnswerInputChange(sIdx, qaIdx, val);
            }}
            handleAnswerBlur={(sIdx, qaIdx) => {
              handleAnswerBlur(sIdx, qaIdx);
            }}
            toggleSeedExampleExpansion={(idx) => {
              toggleSeedExampleExpansion(idx);
            }}
            addDocumentInfo={addDocumentInfoHandler}
            addSeedExample={addSeedExample}
            deleteSeedExample={deleteSeedExample}
            repositoryUrl={knowledgeFormData.knowledgeDocumentRepositoryUrl}
            commitSha={knowledgeFormData.knowledgeDocumentCommit}
          />
        ),
        status: isSeedExamplesValid(knowledgeFormData) ? 'default' : 'error'
      },
      {
        id: STEP_IDS[5],
        name: 'Review Submission',
        component: <ReviewSubmission knowledgeFormData={knowledgeFormData} isGithubMode={false} />
      }
    ],
    [addDocumentInfoHandler, knowledgeEditFormData?.isEditForm, knowledgeFormData]
  );

  useEffect(() => {
    setSubmitEnabled(!steps.find((step) => step.status === 'error'));
  }, [steps]);

  const handleSubmit = async (): Promise<boolean> => {
    const result = await submitNativeKnowledgeData(knowledgeFormData, setActionGroupAlertContent);
    if (result) {
      setKnowledgeFormData(DefaultKnowledgeFormData);
    }
    return result;
  };

  return (
    <PageGroup>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Knowledge Contribution</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection className="knowledge-form" isFilled>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10px' }}>
                  Knowledge Contribution
                </Title>
              </FlexItem>
              <FlexItem>
                {devModeEnabled && (
                  <Button variant="secondary" onClick={autoFillForm}>
                    Auto-Fill
                  </Button>
                )}
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Content component="p">
              Knowledge consists of data and facts and is backed by reference documents. When you contribute knowledge, you provide the documents and
              a collection of questions and answers; this new data is used by the model to answer questions more accurately. The contribution form
              guides you through the process, or you can{' '}
              <Button isInline variant="link" onClick={() => setIsYamlModalOpen(true)}>
                upload an existing yaml file.
              </Button>
            </Content>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Wizard
              height={600}
              startIndex={1}
              onClose={handleCancel}
              onStepChange={(_ev, currentStep) => setActiveStepIndex(STEP_IDS.indexOf(String(currentStep.id)))}
              footer={
                <KnowledgeWizardFooter
                  onCancel={handleCancel}
                  knowledgeFormData={knowledgeFormData}
                  isGithubMode={false}
                  onSubmit={handleSubmit}
                  isValid={true}
                  showSubmit={submitEnabled}
                />
              }
            >
              {steps.map((step, index) => (
                <WizardStep key={step.id} id={step.id} name={step.name} status={index < activeStepIndex ? step.status : 'default'}>
                  {step.component}
                </WizardStep>
              ))}
            </Wizard>
          </FlexItem>
        </Flex>

        <YamlFileUploadModal
          isModalOpen={isYamlModalOpen}
          setIsModalOpen={setIsYamlModalOpen}
          isKnowledgeForm={true}
          onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
          setActionGroupAlertContent={setActionGroupAlertContent}
        />

        <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={onCloseActionGroupAlert} />
      </PageSection>
    </PageGroup>
  );
};

export default KnowledgeFormNative;
