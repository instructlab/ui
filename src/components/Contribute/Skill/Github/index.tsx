// src/components/Contribute/Skill/Github/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import '../skills.css';
import { getGitHubUserInfo } from '../../../../utils/github';
import { useSession } from 'next-auth/react';
import FilePathInformation from '../FilePathInformation/FilePathInformation';
import AttributionInformation from '../AttributionInformation/AttributionInformation';
import Submit from './Submit/Submit';
import { checkSkillFormCompletion } from '../validation';
import { DownloadDropdown } from '../DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from '../ViewDropdown/ViewDropdown';
import Update from './Update/Update';
import { SkillYamlData, SkillFormData, SkillSeedExample } from '@/types';
import { useRouter } from 'next/navigation';
import SkillsSeedExample from '../SkillsSeedExample/SkillsSeedExample';
import SkillsInformation from '../SkillsInformation/SkillsInformation';
import SkillsDescriptionContent from '../SkillsDescription/SkillsDescriptionContent';
import { autoFillSkillsFields } from '../AutoFill';
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
  AlertGroup,
  Alert,
  AlertActionCloseButton,
  Spinner,
  ActionGroup,
  Wizard,
  WizardStep
} from '@patternfly/react-core';
import AuthorInformation from '../../AuthorInformation';
import ReviewSubmission from '../ReviewSubmission';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

export interface SkillEditFormData {
  isEditForm: boolean;
  skillVersion: number;
  pullRequestNumber: number;
  branchName: string;
  oldFilesPath: string;
  skillFormData: SkillFormData;
}

export interface SkillFormProps {
  skillEditFormData?: SkillEditFormData;
}

export const SkillFormGithub: React.FunctionComponent<SkillFormProps> = ({ skillEditFormData }) => {
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | undefined>();

  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string>('');
  // Author Information
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');

  // Skills Information
  const [submissionSummary, setSubmissionSummary] = useState<string>('');
  const [documentOutline, setDocumentOutline] = useState<string>('');

  // File Path Information
  const [filePath, setFilePath] = useState<string>('');

  // Attribution Information
  // State
  const [titleWork, setTitleWork] = useState<string>('');
  const [licenseWork, setLicenseWork] = useState<string>('');
  const [creators, setCreators] = useState<string>('');

  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();

  const [disableAction, setDisableAction] = useState<boolean>(true);
  const [reset, setReset] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [activeStepIndex] = useState<number>(1);
  const router = useRouter();

  const emptySeedExample: SkillSeedExample = {
    immutable: true,
    isExpanded: false,
    context: '',
    isContextValid: ValidatedOptions.default,
    question: '',
    isQuestionValid: ValidatedOptions.default,
    answer: '',
    isAnswerValid: ValidatedOptions.default
  };

  const [seedExamples, setSeedExamples] = useState<SkillSeedExample[]>([
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
    // Set all elements from the skillFormData to the state
    if (skillEditFormData) {
      setEmail(skillEditFormData.skillFormData.email);
      setName(skillEditFormData.skillFormData.name);
      setSubmissionSummary(skillEditFormData.skillFormData.submissionSummary);
      setDocumentOutline(skillEditFormData.skillFormData.documentOutline);
      setFilePath(skillEditFormData.skillFormData.filePath);
      setTitleWork(skillEditFormData.skillFormData.titleWork);
      setLicenseWork(skillEditFormData.skillFormData.licenseWork);
      setCreators(skillEditFormData.skillFormData.creators);
      setSeedExamples(skillEditFormData.skillFormData.seedExamples);
    }
  }, [skillEditFormData]);

  const validateContext = (context: string): ValidatedOptions => {
    // Context is optional
    console.log('context', context);
    return ValidatedOptions.success;
  };

  const validateQuestion = (question: string) => {
    const questionStr = question.trim();
    if (questionStr.length === 0) {
      setDisableAction(true);
      return { msg: 'Question is required', status: ValidatedOptions.error };
    }
    const tokens = questionStr.split(/\s+/);
    if (tokens.length > 0 && tokens.length < 250) {
      setDisableAction(!checkSkillFormCompletion(skillFormData, true));
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
      setDisableAction(!checkSkillFormCompletion(skillFormData, true));
      return { msg: 'Valid input', status: ValidatedOptions.success };
    }
    setDisableAction(true);
    return { msg: 'Answer must be less than 250 words. Current word count: ' + tokens.length, status: ValidatedOptions.error };
  };

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SkillSeedExample, index: number) =>
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
    setSeedExamples(
      seedExamples.map((seedExample: SkillSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              isContextValid: validateContext(seedExample.context ? seedExample.context : '')
            }
          : seedExample
      )
    );
  };

  const handleAnswerInputChange = (seedExampleIndex: number, answerValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SkillSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              answer: answerValue
            }
          : seedExample
      )
    );
  };

  const handleAnswerBlur = (seedExampleIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SkillSeedExample, index: number) => {
        if (index === seedExampleIndex) {
          const { msg, status } = validateAnswer(seedExample.answer);
          return {
            ...seedExample,
            isAnswerValid: status,
            answerValidationError: msg
          };
        }
        return seedExample;
      })
    );
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionValue: string): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SkillSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              question: questionValue
            }
          : seedExample
      )
    );
  };

  const handleQuestionBlur = (seedExampleIndex: number): void => {
    setSeedExamples(
      seedExamples.map((seedExample: SkillSeedExample, index: number) => {
        if (index === seedExampleIndex) {
          const { msg, status } = validateQuestion(seedExample.question);
          return {
            ...seedExample,
            isQuestionValid: status,
            questionValidationError: msg
          };
        }
        return seedExample;
      })
    );
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    setSeedExamples((prevSeedExamples) =>
      prevSeedExamples.map((seedExample, idx) => (idx === index ? { ...seedExample, isExpanded: !seedExample.isExpanded } : seedExample))
    );
    console.log(`toggleSeedExampleExpansion: Seed Example ${index + 1} expanded to ${!seedExamples[index].isExpanded}`);
  };

  const addSeedExample = (): void => {
    const seedExample = emptySeedExample;
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    setSeedExamples([...seedExamples, seedExample]);
    setDisableAction(true);
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    setSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
    setDisableAction(!checkSkillFormCompletion(skillFormData));
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const resetForm = (): void => {
    setEmail('');
    setName('');
    setDocumentOutline('');
    setSubmissionSummary('');
    setTitleWork('');
    setLicenseWork('');
    setCreators('');
    setFilePath('');
    setSeedExamples([emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample, emptySeedExample]);
    setDisableAction(true);

    // setReset is just reset button, value has no impact.
    setReset(reset ? false : true);
  };

  const autoFillForm = (): void => {
    setEmail(autoFillSkillsFields.email);
    setName(autoFillSkillsFields.name);
    setDocumentOutline(autoFillSkillsFields.documentOutline);
    setSubmissionSummary(autoFillSkillsFields.submissionSummary);
    setTitleWork(autoFillSkillsFields.titleWork);
    setLicenseWork(autoFillSkillsFields.licenseWork);
    setCreators(autoFillSkillsFields.creators);
    setFilePath(autoFillSkillsFields.filePath);
    setSeedExamples(autoFillSkillsFields.seedExamples);
  };

  const yamlSeedExampleToFormSeedExample = (yamlSeedExamples: { question: string; context?: string | undefined; answer: string }[]) => {
    return yamlSeedExamples.map((yamlSeedExample) => ({
      immutable: true,
      isExpanded: false,
      context: yamlSeedExample.context ?? '',
      isContextValid: ValidatedOptions.default,
      question: yamlSeedExample.question,
      answer: yamlSeedExample.answer
    })) as SkillSeedExample[];
  };

  const onYamlUploadSkillsFillForm = (data: SkillYamlData): void => {
    setDocumentOutline(data.task_description ?? '');
    setSeedExamples(yamlSeedExampleToFormSeedExample(data.seed_examples));
  };

  const skillFormData: SkillFormData = {
    email: email,
    name: name,
    submissionSummary: submissionSummary,
    documentOutline: documentOutline,
    filePath: filePath,
    seedExamples: seedExamples,
    titleWork: titleWork,
    licenseWork: licenseWork,
    creators: creators
  };

  useEffect(() => {
    setDisableAction(!checkSkillFormCompletion(skillFormData));
  }, [skillFormData]);

  const handleCancel = () => {
    router.push('/dashboard');
  };
  const steps = [
    {
      id: 'author-skill-info',
      name: 'Details',
      component: (
        <>
          <AuthorInformation email={email} setEmail={setEmail} name={name} setName={setName} />
          <SkillsInformation
            reset={reset}
            isEditForm={skillEditFormData?.isEditForm}
            skillFormData={skillFormData}
            setDisableAction={setDisableAction}
            submissionSummary={submissionSummary}
            setSubmissionSummary={setSubmissionSummary}
            documentOutline={documentOutline}
            setDocumentOutline={setDocumentOutline}
          />
        </>
      )
    },
    {
      id: 'file-path-info',
      name: 'File Path Information',
      component: (
        <FilePathInformation reset={reset} path={skillEditFormData ? skillEditFormData.skillFormData.filePath : filePath} setFilePath={setFilePath} />
      )
    },
    {
      id: 'skill-seed-examples',
      name: 'Create seed data',
      component: (
        <SkillsSeedExample
          seedExamples={seedExamples}
          handleContextInputChange={handleContextInputChange}
          handleContextBlur={handleContextBlur}
          handleQuestionInputChange={handleQuestionInputChange}
          handleQuestionBlur={handleQuestionBlur}
          handleAnswerInputChange={handleAnswerInputChange}
          handleAnswerBlur={handleAnswerBlur}
          toggleSeedExampleExpansion={toggleSeedExampleExpansion}
          addSeedExample={addSeedExample}
          deleteSeedExample={deleteSeedExample}
        />
      )
    },
    {
      id: 'attribution-info',
      name: 'Attribution',
      component: (
        <AttributionInformation
          reset={reset}
          isEditForm={skillEditFormData?.isEditForm}
          skillFormData={skillFormData}
          setDisableAction={setDisableAction}
          titleWork={titleWork}
          setTitleWork={setTitleWork}
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
      component: <ReviewSubmission skillFormData={skillFormData} isGithubMode={false} />,
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
          <BreadcrumbItem isActive>Skill Contribution</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection className="skill-form">
        <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10px' }}>
              Skill Contribution
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
          <SkillsDescriptionContent />
        </Content>

        <YamlFileUploadModal
          isModalOpen={isModalOpen}
          setIsModalOpen={setIsModalOpen}
          isKnowledgeForm={false}
          onYamlUploadSkillsFillForm={onYamlUploadSkillsFillForm}
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
                    <a href={actionGroupAlertContent.url} target="_blank" rel="noreferrer">
                      View your pull request
                    </a>
                  )}
              </p>
            </Alert>
          </AlertGroup>
        )}

        <ActionGroup>
          {skillEditFormData?.isEditForm && (
            <Update
              disableAction={disableAction}
              skillFormData={skillFormData}
              pullRequestNumber={skillEditFormData.pullRequestNumber}
              setActionGroupAlertContent={setActionGroupAlertContent}
              oldFilesPath={skillEditFormData.oldFilesPath}
              branchName={skillEditFormData.branchName}
            />
          )}
          {!skillEditFormData?.isEditForm && (
            <Submit
              disableAction={disableAction}
              skillFormData={skillFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              githubUsername={githubUsername}
              resetForm={resetForm}
            />
          )}
          <DownloadDropdown skillFormData={skillFormData} githubUsername={githubUsername} isGithubMode={true} />
          <ViewDropdown skillFormData={skillFormData} githubUsername={githubUsername} isGithubMode={true} />
          <Button variant="link" type="button" onClick={handleCancel}>
            Cancel
          </Button>
        </ActionGroup>
      </PageSection>
    </PageGroup>
  );
};

export default SkillFormGithub;
