// src/components/Contribute/Knowledge/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { CodeIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
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
import DownloadAttribution from './DownloadAttribution/DownloadAttribution';

export interface QuestionAndAnswerPair {
  question: string;
  answer: string;
}

export interface SeedExample {
  context: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export interface KnowledgeFormData {
  email: string;
  name: string;
  submissionSummary: string;
  domain: string;
  documentOutline: string;
  filePath: string;
  seedExamples: SeedExample[];
  knowledgeDocumentRepositoryUrl: string;
  knowledgeDocumentCommit: string;
  documentName: string;
  titleWork: string;
  linkWork: string;
  revision: string;
  licenseWork: string;
  creators: string;
}

export interface ActionGroupAlertContent {
  title: string;
  message: string;
  url?: string;
  success: boolean;
}

export const KnowledgeForm: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string>('');

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
  // Author Information
  const [email, setEmail] = useState<string>('');
  const [name, setName] = useState<string>('');

  // Knowledge Information
  const [submissionSummary, setSubmissionSummary] = useState<string>('');
  const [domain, setDomain] = useState<string>('');
  const [documentOutline, setDocumentOutline] = useState<string>('');

  // File Path Information
  const [filePath, setFilePath] = useState<string>('');

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

  // functions

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  // Submit

  // break

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

  const resetForm = (): undefined => {
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
    setUploadedFiles([]);
    setFilePath('');
    setSeedExamples([emptySeedExample]);
  };

  const handleViewYaml = () => {
    const yamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: SchemaVersion,
      domain: domain!,
      document_outline: documentOutline!,
      seed_examples: seedExamples.map((example) => ({
        context: example.context,
        questions_and_answers: example.questionAndAnswers.map((qa) => ({
          question: qa.question,
          answer: qa.answer
        }))
      })),
      document: {
        repo: knowledgeDocumentRepositoryUrl!,
        commit: knowledgeDocumentCommit!,
        patterns: documentName ? documentName!.split(',').map((pattern) => pattern.trim()) : ['']
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
        <DownloadAttribution knowledgeFormData={knowledgeFormData} setActionGroupAlertContent={setActionGroupAlertContent} />
      </ActionGroup>
      {actionGroupAlertContent && (
        <Alert
          variant={actionGroupAlertContent.success ? 'success' : 'danger'}
          title={actionGroupAlertContent.title}
          actionClose={<AlertActionCloseButton onClose={onCloseActionGroupAlert} />}
        >
          <p>
            {actionGroupAlertContent.message}{' '}
            <a href={actionGroupAlertContent.url} target="_blank" rel="noreferrer">
              {actionGroupAlertContent.url}
            </a>
          </p>
        </Alert>
      )}
    </Form>
  );
};

export default KnowledgeForm;
