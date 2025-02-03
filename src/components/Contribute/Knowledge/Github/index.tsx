// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import '../knowledge.css';
import { getGitHubUserInfo } from '@/utils/github';
import { useSession } from 'next-auth/react';
import AuthorInformation from '@/components/Contribute/AuthorInformation';
import { FormType } from '@/components/Contribute/AuthorInformation';
import KnowledgeInformation from '@/components/Contribute/Knowledge/KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from '@/components/Contribute/Knowledge/FilePathInformation/FilePathInformation';
import DocumentInformation from '@/components/Contribute/Knowledge/Github/DocumentInformation/DocumentInformation';
import AttributionInformation from '@/components/Contribute/Knowledge/AttributionInformation/AttributionInformation';
import Submit from './Submit/Submit';
import KnowledgeDescriptionContent from '@/components/Contribute/Knowledge/KnowledgeDescription/KnowledgeDescriptionContent';
import KnowledgeSeedExample from '@/components/Contribute/Knowledge/Github/KnowledgeSeedExample/KnowledgeSeedExample';
import { checkKnowledgeFormCompletion } from '@/components/Contribute/Knowledge/validation';
import { DownloadDropdown } from '@/components/Contribute/Knowledge/DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from '@/components/Contribute/Knowledge/ViewDropdown/ViewDropdown';
import Update from '@/components/Contribute/Knowledge/Github/Update/Update';
import { KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData, QuestionAndAnswerPair } from '@/types';
import { useRouter } from 'next/navigation';
import { autoFillKnowledgeFields } from '@/components/Contribute/Knowledge/AutoFill';
import ReviewSubmission from '@/components/Contribute/Knowledge/ReviewSubmission';
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
  WizardStep,
  AlertGroup,
  Alert,
  AlertActionCloseButton,
  Spinner,
  ActionGroup
} from '@patternfly/react-core';
import { devLog } from '@/utils/devlog';

export interface ActionGroupAlertContent {
  title: string;
  message: string;
  waitAlert?: boolean;
  url?: string;
  success: boolean;
  timeout?: number | boolean;
}

export interface KnowledgeFormProps {
  knowledgeEditFormData?: KnowledgeEditFormData;
}

export const KnowledgeFormGithub: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData }) => {
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | undefined>();

  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string>('');
  // Author Information
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');

  // Knowledge Information
  const [submissionSummary, setSubmissionSummary] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [documentOutline, setDocumentOutline] = useState<string>('');

  // File Path Information
  const [filePath, setFilePath] = useState<string>('');

  // Document Information (using fields from KnowledgeFormData)
  const [knowledgeDocumentRepositoryUrl, setKnowledgeDocumentRepositoryUrl] = useState<string>('');
  const [knowledgeDocumentCommit, setKnowledgeDocumentCommit] = useState<string>('');
  const [documentName, setDocumentName] = useState<string>(''); // store as comma-separated

  // Attribution Information
  // State
  const [titleWork, setTitleWork] = useState<string>('');
  const [linkWork, setLinkWork] = useState<string>('');
  const [revision, setRevision] = useState<string>('');
  const [licenseWork, setLicenseWork] = useState<string>('');
  const [creators, setCreators] = useState<string>('');

  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();

  const [disableAction, setDisableAction] = useState<boolean>(true);
  const [reset, setReset] = useState<boolean>(false);
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false); // **New State Added**

  const router = useRouter();

  const [activeStepIndex, setActiveStepIndex] = useState<number>(1);

  // Function to create a unique empty seed example
  const createEmptySeedExample = (): KnowledgeSeedExample => ({
    immutable: true,
    isExpanded: false,
    context: '',
    isContextValid: ValidatedOptions.default,
    validationError: '',
    questionAndAnswers: [
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        questionValidationError: '',
        answer: '',
        isAnswerValid: ValidatedOptions.default,
        answerValidationError: ''
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        questionValidationError: '',
        answer: '',
        isAnswerValid: ValidatedOptions.default,
        answerValidationError: ''
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        questionValidationError: '',
        answer: '',
        isAnswerValid: ValidatedOptions.default,
        answerValidationError: ''
      }
    ]
  });

  // Initialize seedExamples with unique objects
  const [seedExamples, setSeedExamples] = useState<KnowledgeSeedExample[]>([
    createEmptySeedExample(),
    createEmptySeedExample(),
    createEmptySeedExample(),
    createEmptySeedExample(),
    createEmptySeedExample()
  ]);

  useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDevModeEnabled(envConfig.ENABLE_DEV_MODE === 'true');
    };
    getEnvVariables();
  }, []);

  useMemo(() => {
    const fetchUserInfo = async () => {
      if (session?.accessToken) {
        try {
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          };

          const fetchedUserInfo = await getGitHubUserInfo(headers);
          setGithubUsername(fetchedUserInfo.login);
          setName(fetchedUserInfo.name);
          setEmail(fetchedUserInfo.email);
        } catch (error) {
          console.error('Failed to fetch GitHub user info:', error);
        }
      }
    };

    fetchUserInfo();
  }, [session?.accessToken]);

  useEffect(() => {
    // Set all elements from the knowledgeFormData to the state
    if (knowledgeEditFormData) {
      setEmail(knowledgeEditFormData.knowledgeFormData.email);
      setName(knowledgeEditFormData.knowledgeFormData.name);
      setSubmissionSummary(knowledgeEditFormData.knowledgeFormData.submissionSummary);
      setDomain(knowledgeEditFormData.knowledgeFormData.domain);
      setDocumentOutline(knowledgeEditFormData.knowledgeFormData.documentOutline);
      setFilePath(knowledgeEditFormData.knowledgeFormData.filePath);
      setKnowledgeDocumentRepositoryUrl(knowledgeEditFormData.knowledgeFormData.knowledgeDocumentRepositoryUrl);
      setKnowledgeDocumentCommit(knowledgeEditFormData.knowledgeFormData.knowledgeDocumentCommit);
      setDocumentName(knowledgeEditFormData.knowledgeFormData.documentName);
      setTitleWork(knowledgeEditFormData.knowledgeFormData.titleWork);
      setLinkWork(knowledgeEditFormData.knowledgeFormData.linkWork);
      setRevision(knowledgeEditFormData.knowledgeFormData.revision);
      setLicenseWork(knowledgeEditFormData.knowledgeFormData.licenseWork);
      setCreators(knowledgeEditFormData.knowledgeFormData.creators);

      setSeedExamples(() =>
        knowledgeEditFormData.knowledgeFormData.seedExamples.map((example) => ({
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
      );

      devLog('Seed Examples Set from Edit Form Data:', knowledgeEditFormData.knowledgeFormData.seedExamples);
    }
  }, [knowledgeEditFormData]);

  const validateContext = (context: string) => {
    // Split the context into words based on spaces
    const contextStr = context.trim();
    if (contextStr.length === 0) {
      setDisableAction(true);
      return { msg: 'Context is required', status: ValidatedOptions.error };
    }
    const tokens = contextStr.split(/\s+/);
    if (tokens.length > 0 && tokens.length <= 500) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return { msg: 'Valid Input', status: ValidatedOptions.success };
    }
    setDisableAction(true);
    const errorMsg = 'Context must be less than 500 words. Current word count: ' + tokens.length;
    return { msg: errorMsg, status: ValidatedOptions.error };
  };

  const validateQuestion = (question: string) => {
    const questionStr = question.trim();
    if (questionStr.length === 0) {
      setDisableAction(true);
      return { msg: 'Question is required', status: ValidatedOptions.error };
    }
    const tokens = questionStr.split(/\s+/);
    if (tokens.length > 0 && tokens.length < 250) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return { msg: 'Valid input', status: ValidatedOptions.success };
    }
    setDisableAction(true);
    return { msg: 'Question must be less than 250 words. Current word count: ' + tokens.length, status: ValidatedOptions.error };
  };

  const validateAnswer = (answer: string) => {
    const answerStr = answer.trim();
    if (answerStr.length === 0) {
      setDisableAction(true);
      return { msg: 'Answer is required', status: ValidatedOptions.error };
    }
    const tokens = answerStr.split(/\s+/);
    if (tokens.length > 0 && tokens.length < 250) {
      setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
      return { msg: 'Valid input', status: ValidatedOptions.success };
    }
    setDisableAction(true);
    return { msg: 'Answer must be less than 250 words. Current word count: ' + tokens.length, status: ValidatedOptions.error };
  };

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              context: contextValue
            }
          : seedExample
      )
    );
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample: KnowledgeSeedExample, index: number): KnowledgeSeedExample => {
        if (index === seedExampleIndex) {
          const { msg, status } = validateContext(seedExample.context);
          devLog(`Context Validation for Seed Example ${seedExampleIndex + 1}: ${msg} (${status})`);
          return {
            ...seedExample,
            isContextValid: status,
            validationError: msg
          };
        }
        return seedExample;
      })
    );
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) =>
                qaIndex === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      question: questionValue
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
    devLog(`Question Input Changed for Seed Example ${seedExampleIndex + 1}, Q&A Pair ${questionAndAnswerIndex + 1}: "${questionValue}"`);
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) => {
                if (qaIndex === questionAndAnswerIndex) {
                  const { msg, status } = validateQuestion(questionAndAnswerPair.question);
                  devLog(`Question Validation for Seed Example ${seedExampleIndex + 1}, Q&A Pair ${questionAndAnswerIndex + 1}: ${msg} (${status})`);
                  return {
                    ...questionAndAnswerPair,
                    isQuestionValid: status,
                    questionValidationError: msg
                  };
                }
                return questionAndAnswerPair;
              })
            }
          : seedExample
      )
    );
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) =>
                qaIndex === questionAndAnswerIndex
                  ? {
                      ...questionAndAnswerPair,
                      answer: answerValue
                    }
                  : questionAndAnswerPair
              )
            }
          : seedExample
      )
    );
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, qaIndex: number) => {
                if (qaIndex === questionAndAnswerIndex) {
                  const { msg, status } = validateAnswer(questionAndAnswerPair.answer);
                  return {
                    ...questionAndAnswerPair,
                    isAnswerValid: status,
                    answerValidationError: msg
                  };
                }
                return questionAndAnswerPair;
              })
            }
          : seedExample
      )
    );
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample))
    );
    devLog(`toggleSeedExampleExpansion: Seed Example ${index + 1} expanded to ${!seedExamples[index].isExpanded}`);
  };

  // Function to append document information (Updated for single repositoryUrl and commitSha)
  // Within src/components/Contribute/Native/index.tsx
  const addDocumentInfoHandler = (repoUrl: string, commitShaValue: string, docName: string) => {
    devLog(`addDocumentInfoHandler: repoUrl=${repoUrl}, commitSha=${commitShaValue}, docName=${docName}`);
    if (knowledgeDocumentCommit && commitShaValue !== knowledgeDocumentCommit) {
      console.error('Cannot add documents from different commit SHAs.');
      setActionGroupAlertContent({
        title: 'Invalid Selection',
        message: 'All documents must be from the same commit SHA.',
        success: false
      });
      return;
    }

    // Set commitSha if not already set
    if (!knowledgeDocumentCommit) {
      setKnowledgeDocumentCommit(commitShaValue);
      devLog(`Set knowledgeDocumentCommit to: ${commitShaValue}`);

      // Set repositoryUrl if not set
      if (!knowledgeDocumentRepositoryUrl) {
        const baseUrl = repoUrl.replace(/\/[^/]+$/, '');
        setKnowledgeDocumentRepositoryUrl(baseUrl);
        devLog(`Set knowledgeDocumentRepositoryUrl to: ${baseUrl}`);
      }
    }

    // Add docName if not already present
    // Split current documentName by comma and trim
    setDocumentName((prevDocumentName) => {
      const currentDocs = prevDocumentName
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0);
      if (!currentDocs.includes(docName)) {
        const newList = currentDocs.length === 0 ? docName : currentDocs.join(', ') + ', ' + docName;
        devLog(`Updated documentName: ${newList}`);
        return newList;
      } else {
        devLog(`Document name "${docName}" is already added.`);
        return prevDocumentName;
      }
    });
  };

  const addSeedExample = (): void => {
    const seedExample = createEmptySeedExample();
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    setSeedExamples([...seedExamples, seedExample]);
    setDisableAction(true);
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    setSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const resetForm = (): void => {
    setEmail('');
    setName('');
    setDocumentOutline('');
    setSubmissionSummary('');
    setDomain('');
    setKnowledgeDocumentRepositoryUrl('');
    setKnowledgeDocumentCommit('');
    setDocumentName('');
    setFilePath('');
    setSeedExamples([
      createEmptySeedExample(),
      createEmptySeedExample(),
      createEmptySeedExample(),
      createEmptySeedExample(),
      createEmptySeedExample()
    ]);
    setDisableAction(true);

    // setReset is just reset button, value has no impact.
    setReset((prev) => !prev);

    setActiveStepIndex(1);
    devLog('Knowledge Form Reset.');
  };

  const autoFillForm = (): void => {
    setEmail(autoFillKnowledgeFields.email);
    setName(autoFillKnowledgeFields.name);
    setDocumentOutline(autoFillKnowledgeFields.documentOutline);
    setSubmissionSummary(autoFillKnowledgeFields.submissionSummary);
    setDomain(autoFillKnowledgeFields.domain);
    setKnowledgeDocumentRepositoryUrl('~/.instructlab-ui/taxonomy-knowledge-docs');
    setKnowledgeDocumentCommit(autoFillKnowledgeFields.knowledgeDocumentCommit);
    setDocumentName(autoFillKnowledgeFields.documentName);
    setFilePath(autoFillKnowledgeFields.filePath);
    setTitleWork(autoFillKnowledgeFields.titleWork);
    setLinkWork(autoFillKnowledgeFields.linkWork);
    setLicenseWork(autoFillKnowledgeFields.licenseWork);
    setCreators(autoFillKnowledgeFields.creators);
    setRevision(autoFillKnowledgeFields.revision);
    setSeedExamples(autoFillKnowledgeFields.seedExamples);
  };
  const yamlSeedExampleToFormSeedExample = (
    yamlSeedExamples: { context: string; questions_and_answers: { question: string; answer: string }[] }[]
  ): KnowledgeSeedExample[] => {
    const mappedSeedExamples = yamlSeedExamples.map((yamlSeedExample) => ({
      immutable: true,
      isExpanded: false,
      context: yamlSeedExample.context,
      isContextValid: ValidatedOptions.default,
      validationError: '',
      questionAndAnswers: yamlSeedExample.questions_and_answers.map((qa) => ({
        immutable: true,
        question: qa.question,
        answer: qa.answer,
        isQuestionValid: ValidatedOptions.default,
        questionValidationError: '',
        isAnswerValid: ValidatedOptions.default,
        answerValidationError: ''
      }))
    }));

    devLog('Mapped Seed Examples from YAML:', mappedSeedExamples);
    return mappedSeedExamples;
  };

  const onYamlUploadKnowledgeFillForm = (data: KnowledgeYamlData): void => {
    setDocumentOutline(data.document_outline ?? '');
    setSubmissionSummary(data.document_outline ?? '');
    setDomain(data.domain ?? '');
    setKnowledgeDocumentRepositoryUrl(data.document.repo ?? '');
    setKnowledgeDocumentCommit(data.document.commit ?? '');
    setDocumentName(data.document.patterns.join(', ') ?? '');
    setSeedExamples(yamlSeedExampleToFormSeedExample(data.seed_examples));
    setActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your knowledge form has been populated based on the uploaded YAML file.',
      success: true
    });
  };

  const knowledgeFormData: KnowledgeFormData = {
    email,
    name,
    submissionSummary,
    domain,
    documentOutline,
    filePath,
    seedExamples,
    knowledgeDocumentRepositoryUrl,
    knowledgeDocumentCommit,
    documentName,
    titleWork,
    linkWork,
    revision,
    licenseWork,
    creators
  };

  devLog('Constructed knowledgeFormData:', knowledgeFormData);

  useEffect(() => {
    devLog('Seed Examples Updated:', seedExamples);
  }, [seedExamples]);

  useEffect(() => {
    setDisableAction(!checkKnowledgeFormCompletion(knowledgeFormData));
  }, [knowledgeFormData]);

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const steps = [
    {
      id: 'author-info',
      name: 'Author Information',
      component: (
        <AuthorInformation
          formType={FormType.Knowledge}
          reset={reset}
          formData={knowledgeFormData}
          setDisableAction={setDisableAction}
          email={email}
          setEmail={setEmail}
          name={name}
          setName={setName}
        />
      )
    },
    {
      id: 'knowledge-info',
      name: 'Knowledge Information',
      component: (
        <KnowledgeInformation
          reset={reset}
          isEditForm={knowledgeEditFormData?.isEditForm}
          knowledgeFormData={knowledgeFormData}
          setDisableAction={setDisableAction}
          submissionSummary={submissionSummary}
          setSubmissionSummary={setSubmissionSummary}
          domain={domain}
          setDomain={setDomain}
          documentOutline={documentOutline}
          setDocumentOutline={setDocumentOutline}
        />
      )
    },
    {
      id: 'file-path-info',
      name: 'File Path Information',
      component: (
        <FilePathInformation
          reset={reset}
          path={knowledgeEditFormData ? knowledgeEditFormData.knowledgeFormData.filePath : filePath}
          setFilePath={setFilePath}
        />
      )
    },
    {
      id: 'document-info',
      name: 'Document Information',
      component: (
        <DocumentInformation
          reset={reset}
          isEditForm={knowledgeEditFormData?.isEditForm}
          knowledgeFormData={knowledgeFormData}
          setDisableAction={setDisableAction}
          knowledgeDocumentRepositoryUrl={knowledgeDocumentRepositoryUrl}
          setKnowledgeDocumentRepositoryUrl={setKnowledgeDocumentRepositoryUrl}
          knowledgeDocumentCommit={knowledgeDocumentCommit}
          setKnowledgeDocumentCommit={setKnowledgeDocumentCommit}
          documentName={documentName}
          setDocumentName={setDocumentName}
        />
      )
    },
    {
      id: 'seed-examples',
      name: 'Seed Examples',
      component: (
        <KnowledgeSeedExample
          seedExamples={seedExamples}
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
          repositoryUrl={knowledgeDocumentRepositoryUrl}
          commitSha={knowledgeDocumentCommit}
        />
      )
    },
    {
      id: 'attribution-info',
      name: 'Attribution Information',
      component: (
        <AttributionInformation
          reset={reset}
          isEditForm={knowledgeEditFormData?.isEditForm}
          knowledgeFormData={knowledgeFormData}
          setDisableAction={setDisableAction}
          titleWork={titleWork}
          setTitleWork={setTitleWork}
          linkWork={linkWork}
          setLinkWork={setLinkWork}
          revision={revision}
          setRevision={setRevision}
          licenseWork={licenseWork}
          setLicenseWork={setLicenseWork}
          creators={creators}
          setCreators={setCreators}
        />
      )
    },
    {
      id: 'review-submission',
      name: 'Review Submission',
      component: <ReviewSubmission knowledgeFormData={knowledgeFormData} isGithubMode={true} />,
      footer: {
        isNextDisabled: true
      }
    }
  ];

  return (
    <PageGroup>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Knowledge Contribution</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection className="knowledge-form">
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
            {'  '}
            <Button variant="secondary" aria-label="User upload of pre-existing yaml file" onClick={() => setIsYamlModalOpen(true)}>
              Upload a YAML file
            </Button>
          </FlexItem>
        </Flex>

        <Content>
          <KnowledgeDescriptionContent />
        </Content>
        <YamlFileUploadModal
          isModalOpen={isYamlModalOpen}
          setIsModalOpen={setIsYamlModalOpen}
          isKnowledgeForm={true}
          onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
          setActionGroupAlertContent={setActionGroupAlertContent}
        />

        <Wizard startIndex={activeStepIndex} onClose={handleCancel} height={600}>
          {steps.map((step) => (
            <WizardStep key={step.id} id={step.id} name={step.name} footer={step.footer}>
              {step.component}
            </WizardStep>
          ))}
        </Wizard>

        {actionGroupAlertContent && (
          <AlertGroup isToast isLiveRegion>
            <Alert
              variant={actionGroupAlertContent.waitAlert ? 'info' : actionGroupAlertContent.success ? 'success' : 'danger'}
              title={actionGroupAlertContent.title}
              timeout={actionGroupAlertContent.timeout === false ? false : actionGroupAlertContent.timeout}
              onTimeout={onCloseActionGroupAlert}
              actionClose={<AlertActionCloseButton onClose={onCloseActionGroupAlert} />}
            >
              <p>
                {actionGroupAlertContent.waitAlert && <Spinner size="md" />}
                {actionGroupAlertContent.message}
                <br />
                {!actionGroupAlertContent.waitAlert &&
                  actionGroupAlertContent.success &&
                  actionGroupAlertContent.url &&
                  actionGroupAlertContent.url.trim().length > 0 && (
                    <a href={actionGroupAlertContent.url} rel="noreferrer">
                      View your new branch
                    </a>
                  )}
              </p>
            </Alert>
          </AlertGroup>
        )}

        <ActionGroup>
          {knowledgeEditFormData?.isEditForm && (
            <Update
              disableAction={disableAction}
              knowledgeFormData={knowledgeFormData}
              pullRequestNumber={knowledgeEditFormData.pullRequestNumber}
              oldFilesPath={knowledgeEditFormData.oldFilesPath}
              branchName={knowledgeEditFormData.branchName}
              setActionGroupAlertContent={setActionGroupAlertContent}
            />
          )}
          {!knowledgeEditFormData?.isEditForm && (
            <Submit
              disableAction={disableAction}
              knowledgeFormData={knowledgeFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              githubUsername={githubUsername}
              resetForm={resetForm}
            />
          )}
          <DownloadDropdown knowledgeFormData={knowledgeFormData} githubUsername={githubUsername} />
          <ViewDropdown knowledgeFormData={knowledgeFormData} githubUsername={githubUsername} />
          <Button variant="link" type="button" onClick={handleCancel}>
            Cancel
          </Button>
        </ActionGroup>
      </PageSection>
    </PageGroup>
  );
};

export default KnowledgeFormGithub;
