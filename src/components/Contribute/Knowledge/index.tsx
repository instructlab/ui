// src/components/Contribute/Knowledge/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { CodeIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { validateFields } from '../../../utils/validation';
import { getGitHubUsername } from '../../../utils/github';
import { useSession } from 'next-auth/react';
import YamlCodeModal from '../../YamlCodeModal';
import { SchemaVersion, KnowledgeYamlData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import KnowledgeDescription from './KnowledgeDescription/KnowledgeDescription';
import AuthorInformation from './AuthorInformation/AuthorInformation';
import KnowledgeInformation from './KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from './FilePathInformation/FilePathInformation';
import KnowledgeQuestionAnswerPairs from './KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs';
import DocumentInformation from './DocumentInformation/DocumentInformation';
import AttributionInformation from './AttributionInformation/AttributionInformation';
import Submit from './Submit/Submit';
import DownloadYaml from './DownloadYaml/DownloadYaml';

export interface QuestionAndAnswerPair {
  question: string;
  answer: string;
}

export interface SeedExample {
  context: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export interface KnowledgeFormData {
  email: string | undefined;
  name: string | undefined;
  submissionSummary: string | undefined;
  domain: string | undefined;
  documentOutline: string | undefined;
  filePath: string | undefined;
  seedExamples: SeedExample[];
  knowledgeDocumentRepositoryUrl: string | undefined;
  knowledgeDocumentCommit: string | undefined;
  documentName: string | undefined;
  titleWork: string | undefined;
  linkWork: string | undefined;
  revision: string | undefined;
  licenseWork: string | undefined;
  creators: string | undefined;
}

export interface ActionGroupAlertContent {
  title: string;
  message: string;
  success: boolean;
}

export const KnowledgeForm: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string | undefined>();

  useEffect(() => {
    const fetchUsername = async () => {
      if (session?.accessToken) {
        try {
          const fetchedUsername = await getGitHubUsername(session.accessToken);
          setGithubUsername(fetchedUsername);
        } catch (error) {
          console.error('Failed to fetch GitHub username:', error);
        }
      }
    };

    fetchUsername();
  }, [session?.accessToken]);

  const [task_description, setTaskDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  // Knowledge Information
  const [submissionSummary, setSubmissionSummary] = useState<string | undefined>();
  const [domain, setDomain] = useState<string | undefined>();
  const [documentOutline, setDocumentOutline] = useState<string | undefined>();

  // File Path Information
  const [filePath, setFilePath] = useState<string | undefined>();

  // Knowledge Question Answer Pairs

  // State

  const emptySeedExample: SeedExample = {
    context: '',
    questionAndAnswers: [
      {
        question: '',
        answer: ''
      },
      {
        question: '',
        answer: ''
      },
      {
        question: '',
        answer: ''
      }
    ]
  };

  const [seedExamples, setSeedExamples] = useState<SeedExample[]>([emptySeedExample]);

  // Functions

  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): undefined => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              context: contextValue
            }
          : seedExample
      )
    );
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): undefined => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
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

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): undefined => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
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

  const addQuestionAnswerPair = (seedExampleIndex: number): undefined => {
    const newQuestionAnswerPair: QuestionAndAnswerPair = {
      question: '',
      answer: ''
    };
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: [...seedExample.questionAndAnswers, newQuestionAnswerPair]
            }
          : seedExample
      )
    );
  };

  const deleteQuestionAnswerPair = (seedExampleIndex: number, questionAnswerIndex: number): undefined => {
    setSeedExamples(
      seedExamples.map((seedExample: SeedExample, index: number) =>
        index === seedExampleIndex
          ? {
              ...seedExample,
              questionAndAnswers: seedExample.questionAndAnswers.filter((_, i) => i !== questionAnswerIndex)
            }
          : seedExample
      )
    );
  };

  const addSeedExample = (): undefined => {
    setSeedExamples([...seedExamples, emptySeedExample]);
  };

  // Document Information
  // State

  const [knowledgeDocumentRepositoryUrl, setKnowledgeDocumentRepositoryUrl] = useState<string | undefined>();
  const [knowledgeDocumentCommit, setKnowledgeDocumentCommit] = useState<string | undefined>();
  // This used to be 'patterns' but I am not totally sure what this variable actually is...
  const [documentName, setDocumentName] = useState<string | undefined>();

  // Attribution Information
  // State
  const [titleWork, setTitleWork] = useState<string | undefined>();
  const [linkWork, setLinkWork] = useState<string | undefined>();
  const [revision, setRevision] = useState<string | undefined>();
  const [licenseWork, setLicenseWork] = useState<string | undefined>();
  const [creators, setCreators] = useState<string | undefined>();

  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();

  // functions

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  // Submit

  // break

  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = useState(false);

  const [successAlertLink, setSuccessAlertLink] = useState<string>('');

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

  const resetForm = (): undefined => {
    setEmail(undefined);
    setName(undefined);
    setDocumentOutline(undefined);
    setSubmissionSummary(undefined);
    setDomain(undefined);
    setKnowledgeDocumentRepositoryUrl(undefined);
    setKnowledgeDocumentCommit(undefined);
    setDocumentName(undefined);
    setTitleWork(undefined);
    setLinkWork(undefined);
    setLicenseWork(undefined);
    setCreators(undefined);
    setRevision(undefined);
    setUploadedFiles([]);
    setFilePath(undefined);
    setSeedExamples([emptySeedExample]);
  };

  const handleDownloadAttribution = () => {
    const attributionFields = { title_work, link_work, revision, license_work, creators };

    const validation = validateFields(attributionFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    const attributionContent = `Title of work: ${title_work}
Link to work: ${link_work}
Revision: ${submissionSummary}
License of the work: ${license_work}
Creator names: ${creators}
`;

    const blob = new Blob([attributionContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attribution.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleViewYaml = () => {
    const yamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: SchemaVersion,
      domain: domain,
      document_outline: documentOutline,
      seed_examples: seedExamples.map((example) => ({
        context: example.context,
        questions_and_answers: example.questions_and_answers.map((qa) => ({
          question: qa.question,
          answer: qa.answer
        }))
      })),
      document: {
        repo: repo,
        commit: commit,
        patterns: patterns.split(',').map((pattern) => pattern.trim())
      }
    };

    const yamlString = dumpYaml(yamlData);
    setYamlContent(yamlString);
    setIsModalOpen(true);
  };

  const knowledgeFormData: KnowledgeFormData = {
    email: email,
    name: name,
    submissionSummary: submissionSummary,
    domain: domain,
    documentOutline: documentOutline,
    filePath: filePath,
    seedExamples: seedExamples,
    knowledgeDocumentRepositoryUrl: knowledgeDocumentRepositoryUrl,
    knowledgeDocumentCommit: knowledgeDocumentCommit,
    documentName: documentName,
    titleWork: titleWork,
    linkWork: linkWork,
    revision: revision,
    licenseWork: licenseWork,
    creators: creators
  };

  return (
    <Form className="form-k">
      <YamlCodeModal isModalOpen={isModalOpen} handleModalToggle={() => setIsModalOpen(!isModalOpen)} yamlContent={yamlContent} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormFieldGroupHeader titleText={{ text: 'Knowledge Contribution Form', id: 'knowledge-contribution-form-id' }} />
        <Button variant="plain" onClick={handleViewYaml} aria-label="View YAML">
          <CodeIcon /> View YAML
        </Button>
      </div>

      <KnowledgeDescription />

      <AuthorInformation email={email} setEmail={setEmail} name={name} setName={setName} />

      <KnowledgeInformation
        submissionSummary={submissionSummary}
        setSubmissionSummary={setSubmissionSummary}
        domain={domain}
        setDomain={setDomain}
        documentOutline={documentOutline}
        setDocumentOutline={setDocumentOutline}
      />

      <FilePathInformation setFilePath={setFilePath} />

      <KnowledgeQuestionAnswerPairs
        seedExamples={seedExamples}
        handleContextInputChange={handleContextInputChange}
        handleQuestionInputChange={handleQuestionInputChange}
        handleAnswerInputChange={handleAnswerInputChange}
        deleteQuestionAnswerPair={deleteQuestionAnswerPair}
        addQuestionAnswerPair={addQuestionAnswerPair}
        addSeedExample={addSeedExample}
      />

      <DocumentInformation
        knowledgeDocumentRepositoryUrl={knowledgeDocumentRepositoryUrl}
        setKnowledgeDocumentRepositoryUrl={setKnowledgeDocumentRepositoryUrl}
        knowledgeDocumentCommit={knowledgeDocumentCommit}
        setKnowledgeDocumentCommit={setKnowledgeDocumentCommit}
        documentName={documentName}
        setDocumentName={setDocumentName}
        uploadedFiles={uploadedFiles}
        setUploadedFiles={setUploadedFiles}
      />

      <AttributionInformation
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

      <ActionGroup>
        <Submit
          knowledgeFormData={knowledgeFormData}
          setActionGroupAlertContent={setActionGroupAlertContent}
          githubUsername={githubUsername}
          resetForm={resetForm}
        />
        <DownloadYaml knowledgeFormData={knowledgeFormData} setActionGroupAlertContent={setActionGroupAlertContent} githubUsername={githubUsername} />
        <Button variant="primary" type="button" onClick={handleDownloadAttribution}>
          Download Attribution
        </Button>
      </ActionGroup>
      {actionGroupAlertContent && (
        <Alert
          variant={actionGroupAlertContent.success ? 'success' : 'danger'}
          title={actionGroupAlertContent.title}
          actionClose={<AlertActionCloseButton onClose={onCloseActionGroupAlert} />}
          actionLinks={
            <>
              <AlertActionLink component="a" href={successAlertLink} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            </>
          }
        >
          {actionGroupAlertContent.message}
        </Alert>
      )}
    </Form>
  );
};

export default KnowledgeForm;
