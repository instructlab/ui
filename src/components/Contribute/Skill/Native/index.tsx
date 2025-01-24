// src/components/Contribute/Skill/Native/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import '../skills.css';
import { useSession } from 'next-auth/react';
import AuthorInformation from '@/components/Contribute/AuthorInformation';
import { FormType } from '@/components/Contribute/AuthorInformation';
import FilePathInformation from '@/components/Contribute/Skill/FilePathInformation/FilePathInformation';
import AttributionInformation from '@/components/Contribute/Skill/AttributionInformation/AttributionInformation';
import Submit from '@/components/Contribute/Skill/Native/Submit/Submit';
import { checkSkillFormCompletion } from '@/components/Contribute/Skill/validation';
import { DownloadDropdown } from '@/components/Contribute/Skill/DownloadDropdown/DownloadDropdown';
import { ViewDropdown } from '@/components/Contribute/Skill/ViewDropdown/ViewDropdown';
import Update from '@/components/Contribute/Skill/Github/Update/Update';
import { PullRequestFile, SkillSeedExample, SkillFormData, SkillYamlData } from '@/types';
import { useRouter } from 'next/navigation';
import SkillsSeedExample from '@/components/Contribute/Skill/SkillsSeedExample/SkillsSeedExample';
import SkillsInformation from '@/components/Contribute/Skill/SkillsInformation/SkillsInformation';
import SkillsDescriptionContent from '@/components/Contribute/Skill/SkillsDescription/SkillsDescriptionContent';
import { autoFillSkillsFields } from '@/components/Contribute/Skill/AutoFill';
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
import ReviewSubmission from '../ReviewSubmission';

export interface SkillEditFormData {
  isEditForm: boolean;
  skillVersion: number;
  pullRequestNumber: number;
  branchName: string;
  yamlFile: PullRequestFile;
  attributionFile: PullRequestFile;
  skillFormData: SkillFormData;
}

export interface ActionGroupAlertContent {
  title: string;
  message: string;
  waitAlert?: boolean;
  url?: string;
  success: boolean;
  timeout?: number | boolean;
}

export interface SkillFormProps {
  skillEditFormData?: SkillEditFormData;
}

export const SkillFormNative: React.FunctionComponent<SkillFormProps> = ({ skillEditFormData }) => {
  const [devModeEnabled, setDevModeEnabled] = useState<boolean | undefined>();

  const { data: session } = useSession();
  const [githubUsername] = useState<string>('');
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
    if (session?.user?.name && session?.user?.email) {
      setName(session?.user?.name);
      setEmail(session?.user?.email);
    }
  }, [session?.user]);

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

  const validateQuestion = (question: string): ValidatedOptions => {
    if (question.length > 0 && question.length < 250) {
      setDisableAction(!checkSkillFormCompletion(skillFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
  };

  const validateAnswer = (answer: string): ValidatedOptions => {
    if (answer.length > 0 && answer.length < 250) {
      setDisableAction(!checkSkillFormCompletion(skillFormData));
      return ValidatedOptions.success;
    }
    setDisableAction(true);
    return ValidatedOptions.error;
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
      seedExamples.map((seedExample: SkillSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              isAnswerValid: validateAnswer(seedExample.answer)
            }
          : seedExample
      )
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
      seedExamples.map((seedExample: SkillSeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              isQuestionValid: validateQuestion(seedExample.question)
            }
          : seedExample
      )
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
    setName(data.created_by ?? '');
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
          <AuthorInformation
            formType={FormType.Knowledge}
            reset={reset}
            formData={skillFormData}
            setDisableAction={setDisableAction}
            email={email}
            setEmail={setEmail}
            name={name}
            setName={setName}
          />
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
      component: <ReviewSubmission skillFormData={skillFormData} />,
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
                      View your skill contribution
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
              yamlFile={skillEditFormData.yamlFile}
              attributionFile={skillEditFormData.attributionFile}
              branchName={skillEditFormData.branchName}
            />
          )}
          {!skillEditFormData?.isEditForm && (
            <Submit
              disableAction={disableAction}
              skillFormData={skillFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              email={email}
              resetForm={resetForm}
            />
          )}
          <DownloadDropdown skillFormData={skillFormData} githubUsername={githubUsername} />
          <ViewDropdown skillFormData={skillFormData} githubUsername={githubUsername} />
          <Button variant="link" type="button" onClick={handleCancel}>
            Cancel
          </Button>
        </ActionGroup>
      </PageSection>
    </PageGroup>
  );
};

export default SkillFormNative;
