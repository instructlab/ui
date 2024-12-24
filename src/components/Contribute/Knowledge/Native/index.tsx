// src/components/Contribute/Native/Knowledge/index.tsx
'use client';
import React, { useEffect, useMemo, useState } from 'react';
import '../knowledge.css';
import { Alert, AlertActionCloseButton, AlertGroup } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { getGitHubUsername } from '@/utils/github';
import { useSession } from 'next-auth/react';
import AuthorInformation from '@/components/Contribute/AuthorInformation';
import { FormType } from '@/components/Contribute/AuthorInformation';
import KnowledgeInformation from '@/components/Contribute/Knowledge/KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from '@/components/Contribute/Knowledge/FilePathInformation/FilePathInformation';
import DocumentInformation from '@/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation';
import AttributionInformation from '@/components/Contribute/Knowledge/AttributionInformation/AttributionInformation';
import Submit from './Submit/Submit';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { PageBreadcrumb } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageGroup } from '@patternfly/react-core/dist/dynamic/components/Page';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import KnowledgeDescriptionContent from '@/components/Contribute/Knowledge/KnowledgeDescription/KnowledgeDescriptionContent';
import KnowledgeSeedExample from '@/components/Contribute/Knowledge/KnowledgeSeedExample/KnowledgeSeedExample';
import { checkKnowledgeFormCompletion } from '@/components/Contribute/Knowledge/validation';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { DownloadDropdown } from '@/components/Contribute/Knowledge/DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from '@/components/Contribute/Knowledge/ViewDropdown/ViewDropdown';
import Update from '@/components/Contribute/Knowledge/Github/Update/Update';
import { KnowledgeEditFormData, KnowledgeFormData, KnowledgeYamlData, QuestionAndAnswerPair } from '@/types';
import { Button } from '@patternfly/react-core/dist/esm/components/Button/Button';
import { useRouter } from 'next/navigation';
import { autoFillKnowledgeFields } from '@/components/Contribute/Knowledge/AutoFill';
import { Spinner } from '@patternfly/react-core/dist/esm/components/Spinner';
import { Wizard, WizardStep } from '@patternfly/react-core/dist/esm/components/Wizard';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import ReviewSubmission from '../ReviewSubmission';
import { Flex } from '@patternfly/react-core/dist/esm/layouts/Flex/Flex';
import { FlexItem } from '@patternfly/react-core/dist/esm/layouts/Flex/FlexItem';
import { YamlFileUploadModal } from '../../YamlFileUploadModal';

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

export const KnowledgeFormNative: React.FunctionComponent<KnowledgeFormProps> = ({ knowledgeEditFormData }) => {
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

  const [knowledgeDocumentRepositoryUrl, setKnowledgeDocumentRepositoryUrl] = useState<string>('');
  const [knowledgeDocumentCommit, setKnowledgeDocumentCommit] = useState<string>('');
  // This used to be 'patterns' but I am not totally sure what this variable actually is...
  const [documentName, setDocumentName] = useState<string>('');

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
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const router = useRouter();

  const [activeStepIndex] = useState<number>(1);

  const emptySeedExample: KnowledgeSeedExample = {
    immutable: true,
    isExpanded: false,
    context: '',
    isContextValid: ValidatedOptions.default,
    questionAndAnswers: [
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      },
      {
        immutable: true,
        question: '',
        isQuestionValid: ValidatedOptions.default,
        answer: '',
        isAnswerValid: ValidatedOptions.default
      }
    ]
  };

  const [seedExamples, setSeedExamples] = useState<KnowledgeSeedExample[]>([
    emptySeedExample,
    emptySeedExample,
    emptySeedExample,
    emptySeedExample,
    emptySeedExample
  ]);

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
      setName(session?.user?.name);
      setEmail(session?.user?.email);
    }
  }, [session?.user]);

  useMemo(() => {
    const fetchUsername = async () => {
      if (session?.accessToken) {
        try {
          const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.accessToken}`,
            Accept: 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28'
          };

          const fetchedUsername = await getGitHubUsername(headers);
          setGithubUsername(fetchedUsername);
        } catch (error) {
          console.error('Failed to fetch GitHub username:', error);
        }
      }
    };

    fetchUsername();
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
      setSeedExamples(knowledgeEditFormData.knowledgeFormData.seedExamples);
    }
  }, [knowledgeEditFormData]);

  const validateContext = (context: string) => {
    // Split the context into words based on spaces
    const contextStr = context.trim();
    if (contextStr.length == 0) {
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
    if (questionStr.length == 0) {
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
    if (answerStr.length == 0) {
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
    setSeedExamples(
      seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
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
    const updatedSeedExamples = seedExamples.map((seedExample: KnowledgeSeedExample, index: number): KnowledgeSeedExample => {
      if (index === seedExampleIndex) {
        const { msg, status } = validateContext(seedExample.context);
        return {
          ...seedExample,
          isContextValid: status,
          validationError: msg
        };
      }
      return seedExample;
    });
    setSeedExamples(updatedSeedExamples);
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
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
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) => {
                if (index === questionAndAnswerIndex) {
                  const { msg, status } = validateQuestion(questionAndAnswerPair.question);
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
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) =>
                index === questionAndAnswerIndex
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
    setSeedExamples(
      seedExamples.map((seedExample: KnowledgeSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, index: number) => {
                if (index === questionAndAnswerIndex) {
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

  // const toggleSeedExampleExpansion = (index: number): void => {
  //   setSeedExamples(seedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample)));
  // };

  const toggleSeedExampleExpansion = (index: number): void => {
    setSeedExamples(seedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample)));
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
    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
    setRevision('');
    setFilePath('');
    setSeedExamples([emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample]);
    setDisableAction(true);

    // setReset is just reset button, value has no impact.
    setReset(reset ? false : true);
  };

  const autoFillForm = (): void => {
    setEmail(autoFillKnowledgeFields.email);
    setName(autoFillKnowledgeFields.name);
    setDocumentOutline(autoFillKnowledgeFields.documentOutline);
    setSubmissionSummary(autoFillKnowledgeFields.submissionSummary);
    setDomain(autoFillKnowledgeFields.domain);
    setKnowledgeDocumentRepositoryUrl(autoFillKnowledgeFields.knowledgeDocumentRepositoryUrl);
    setKnowledgeDocumentCommit(autoFillKnowledgeFields.knowledgeDocumentCommit);
    setDocumentName(autoFillKnowledgeFields.documentName);
    setTitleWork(autoFillKnowledgeFields.titleWork);
    setLinkWork(autoFillKnowledgeFields.linkWork);
    setLicenseWork(autoFillKnowledgeFields.licenseWork);
    setCreators(autoFillKnowledgeFields.creators);
    setRevision(autoFillKnowledgeFields.revision);
    setSeedExamples(autoFillKnowledgeFields.seedExamples);
  };
  const yamlSeedExampleToFormSeedExample = (
    yamlSeedExamples: { context: string; questions_and_answers: { question: string; answer: string }[] }[]
  ) => {
    return yamlSeedExamples.map((yamlSeedExample) => ({
      immutable: true,
      isExpanded: false,
      context: yamlSeedExample.context ?? '',
      isContextValid: ValidatedOptions.default,
      questionAndAnswers: yamlSeedExample.questions_and_answers.map((questionAndAnswer) => ({
        question: questionAndAnswer.question ?? '',
        answer: questionAndAnswer.answer ?? ''
      }))
    })) as KnowledgeSeedExample[];
  };

  const onYamlUploadKnowledgeFillForm = (data: KnowledgeYamlData): void => {
    setName(data.created_by ?? '');
    setDocumentOutline(data.document_outline ?? '');
    setSubmissionSummary(data.document_outline ?? '');
    setDomain(data.domain ?? '');
    setKnowledgeDocumentRepositoryUrl(data.document.repo ?? '');
    setKnowledgeDocumentCommit(data.document.commit ?? '');
    setDocumentName(data.document.patterns.join(', ') ?? '');
    setSeedExamples(yamlSeedExampleToFormSeedExample(data.seed_examples));
  };

  const knowledgeFormData: KnowledgeFormData = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

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
      id: 'seed-examples',
      name: 'Seed Examples',
      component: (
        <KnowledgeSeedExample
          seedExamples={seedExamples}
          handleContextInputChange={handleContextInputChange}
          handleContextBlur={handleContextBlur}
          handleQuestionInputChange={handleQuestionInputChange}
          handleQuestionBlur={handleQuestionBlur}
          handleAnswerInputChange={handleAnswerInputChange}
          handleAnswerBlur={handleAnswerBlur}
          toggleSeedExampleExpansion={toggleSeedExampleExpansion}
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
      component: <ReviewSubmission knowledgeFormData={knowledgeFormData} />,
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

      <PageSection className="knowledge-form" style={{ backgroundColor: 'white' }}>
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
            <Button variant="secondary" aria-label="User upload of pre-existing yaml file" onClick={() => setIsModalOpen(true)}>
              Upload a YAML file
            </Button>
          </FlexItem>
        </Flex>

        <Content>
          <KnowledgeDescriptionContent />
        </Content>
        <YamlFileUploadModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          isKnowledgeForm={true}
          onYamlUploadKnowledgeFillForm={onYamlUploadKnowledgeFillForm}
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
              timeout={actionGroupAlertContent.timeout == false ? false : actionGroupAlertContent.timeout}
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
              setActionGroupAlertContent={setActionGroupAlertContent}
              yamlFile={knowledgeEditFormData.yamlFile}
              attributionFile={knowledgeEditFormData.attributionFile}
              branchName={knowledgeEditFormData.branchName}
            />
          )}
          {!knowledgeEditFormData?.isEditForm && (
            <Submit
              disableAction={disableAction}
              knowledgeFormData={knowledgeFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              email={email}
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

export default KnowledgeFormNative;
