// src/components/Contribute/Knowledge/index.tsx
'use client';
import React, { useEffect, useState } from 'react';
import './knowledge.css';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup, FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { CodeIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { validateFields, validateEmail, validateUniqueItems } from '../../../utils/validation';
import { getGitHubUsername } from '../../../utils/github';
import { useSession } from 'next-auth/react';
import YamlCodeModal from '../../YamlCodeModal';
import { SchemaVersion, KnowledgeYamlData, AttributionData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import KnowledgeDescription from './KnowledgeDescription/KnowledgeDescription';
import AuthorInformation from './AuthorInformation/AuthorInformation';
import KnowledgeInformation from './KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from './FilePathInformation/FilePathInformation';
import KnowledgeQuestionAnswerPairs from './KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs';
import DocumentInformation from './DocumentInformation/DocumentInformation';
import AttributionInformation from './AttributionInformation/AttributionInformation';

export interface QuestionAndAnswerPair {
  question: string;
  answer: string;
}

export interface SeedExample {
  context: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export const KnowledgeForm: React.FunctionComponent = () => {
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = useState<string | null>(null);

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

  // break
  // Attribution Information
  const [titleWork, setTitleWork] = useState<string | undefined>();
  const [linkWork, setLinkWork] = useState<string | undefined>();
  const [revision, setRevision] = useState<string | undefined>();
  const [licenseWork, setLicenseWork] = useState<string | undefined>();
  const [creators, setCreators] = useState<string | undefined>();

  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = useState(false);

  const [successAlertLink, setSuccessAlertLink] = useState<string>('');

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

  const resetForm = () => {
    setEmail('');
    setName('');
    setDocumentOutline('');
    setSubmissionSummary('');
    setDomain('');
    setRepo('');
    setCommit('');
    setPatterns('');
    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
    setRevision('');
    setUploadedFiles([]);
    setFilePath('');
    setSeedExamples([
      {
        context: '',
        questions_and_answers: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]
      },
      {
        context: '',
        questions_and_answers: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]
      },
      {
        context: '',
        questions_and_answers: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]
      },
      {
        context: '',
        questions_and_answers: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]
      },
      {
        context: '',
        questions_and_answers: [
          { question: '', answer: '' },
          { question: '', answer: '' },
          { question: '', answer: '' }
        ]
      }
    ]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Strip leading slash and ensure trailing slash in the file path
    // let sanitizedFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    // sanitizedFilePath = sanitizedFilePath.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

    // const infoFields = { email, name, documentOutline, submissionSummary, domain, repo, commit, patterns };
    // const attributionFields = { title_work, link_work, revision, license_work, creators };

    // let validation = validateFields(infoFields);
    // if (!validation.valid) {
    //   setFailureAlertTitle('Something went wrong!');
    //   setFailureAlertMessage(validation.message);
    //   setIsFailureAlertVisible(true);
    //   return;
    // }

    // validation = validateFields(attributionFields);
    // if (!validation.valid) {
    //   setFailureAlertTitle('Something went wrong!');
    //   setFailureAlertMessage(validation.message);
    //   setIsFailureAlertVisible(true);
    //   return;
    // }

    // validation = validateEmail(email);
    // if (!validation.valid) {
    //   setFailureAlertTitle('Something went wrong!');
    //   setFailureAlertMessage(validation.message);
    //   setIsFailureAlertVisible(true);
    //   return;
    // }

    for (const example of seedExamples) {
      const questions = example.questions_and_answers.map((qa) => qa.question);
      const answers = example.questions_and_answers.map((qa) => qa.answer);
      validation = validateUniqueItems(questions, 'questions');
      if (!validation.valid) {
        setFailureAlertTitle('Something went wrong!');
        setFailureAlertMessage(validation.message);
        setIsFailureAlertVisible(true);
        return;
      }

      validation = validateUniqueItems(answers, 'answers');
      if (!validation.valid) {
        setFailureAlertTitle('Something went wrong!');
        setFailureAlertMessage(validation.message);
        setIsFailureAlertVisible(true);
        return;
      }
    }

    const knowledgeData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: SchemaVersion,
      domain: domain,
      document_outline: document_outline,
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

    const yamlString = dumpYaml(knowledgeData);

    const attributionData: AttributionData = {
      title_of_work: title_work,
      link_to_work: link_work,
      revision: revision,
      license_of_the_work: license_work,
      creator_names: creators
    };

    try {
      const response = await fetch('/api/pr/knowledge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: yamlString, attribution: attributionData, name, email, submission_summary, filePath: sanitizedFilePath })
      });

      if (!response.ok) {
        throw new Error('Failed to submit knowledge data');
      }

      const result = await response.json();
      setSuccessAlertTitle('Knowledge contribution submitted successfully!');
      setSuccessAlertMessage('A pull request containing your knowledge submission has been successfully created.');
      setSuccessAlertLink(result.html_url);
      setIsSuccessAlertVisible(true);
      // resetForm();
      // Alternative?
      // const form = event.target as HTMLFormElement;
      // form.reset();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFailureAlertTitle('Failed to submit your Knowledge contribution');
        setFailureAlertMessage(error.message);
        setIsFailureAlertVisible(true);
      }
    }
  };

  const handleDownloadYaml = () => {
    const infoFields = { email, name, documentOutline, submissionSummary, domain, repo, commit, patterns };
    const attributionFields = { title_work, link_work, revision, license_work, creators };

    let validation = validateFields(infoFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    validation = validateFields(attributionFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    // validation = validateEmail(email);
    // if (!validation.valid) {
    //   setFailureAlertTitle('Something went wrong!');
    //   setFailureAlertMessage(validation.message);
    //   setIsFailureAlertVisible(true);
    //   return;
    // }

    const yamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: SchemaVersion,
      domain: domain,
      document_outline: document_outline,
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
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
        <Button variant="primary" type="submit" onClick={handleSubmit}>
          Submit Knowledge
        </Button>
        <Button variant="primary" type="button" onClick={handleDownloadYaml}>
          Download YAML
        </Button>
        <Button variant="primary" type="button" onClick={handleDownloadAttribution}>
          Download Attribution
        </Button>
      </ActionGroup>
    </Form>
  );
};

export default KnowledgeForm;
