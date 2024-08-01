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
import { UploadFile } from './UploadFile';
import { SchemaVersion, KnowledgeYamlData, AttributionData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import KnowledgeDescription from './KnowledgeDescription/KnowledgeDescription';
import AuthorInformation from './AuthorInformation/AuthorInformation';
import KnowledgeInformation from './KnowledgeInformation/KnowledgeInformation';
import FilePathInformation from './FilePathInformation/FilePathInformation';
import KnowledgeQuestionAnswerPairs from './KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs';

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

  const [repo, setRepo] = useState('');
  const [commit, setCommit] = useState('');
  const [patterns, setPatterns] = useState('');

  const [title_work, setTitleWork] = useState('');
  const [link_work, setLinkWork] = useState('');
  const [revision, setRevision] = useState('');
  const [license_work, setLicenseWork] = useState('');
  const [creators, setCreators] = useState('');

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

  // break

  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = useState(false);

  const [failure_alert_title, setFailureAlertTitle] = useState('');
  const [failure_alert_message, setFailureAlertMessage] = useState<string>('');

  const [success_alert_title, setSuccessAlertTitle] = useState('');
  const [success_alert_message, setSuccessAlertMessage] = useState<React.ReactNode>('');
  const [successAlertLink, setSuccessAlertLink] = useState<string>('');

  const [useFileUpload, setUseFileUpload] = useState(true);
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

  const onCloseSuccessAlert = () => {
    setIsSuccessAlertVisible(false);
  };

  const onCloseFailureAlert = () => {
    setIsFailureAlertVisible(false);
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
    setPatterns(files.map((file) => file.name).join(', ')); // Populate the patterns field
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Strip leading slash and ensure trailing slash in the file path
    let sanitizedFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    sanitizedFilePath = sanitizedFilePath.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

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

  const handleDocumentUpload = async () => {
    if (uploadedFiles.length > 0) {
      const fileContents: { fileName: string; fileContent: string }[] = [];

      await Promise.all(
        uploadedFiles.map(
          (file) =>
            new Promise<void>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                const fileContent = e.target!.result as string;
                fileContents.push({ fileName: file.name, fileContent });
                resolve();
              };
              reader.onerror = reject;
              reader.readAsText(file);
            })
        )
      );

      if (fileContents.length === uploadedFiles.length) {
        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ files: fileContents })
          });

          const result = await response.json();
          if (response.ok) {
            setRepo(result.repoUrl);
            setCommit(result.commitSha);
            setPatterns(result.documentNames.join(', ')); // Populate the patterns field
            console.log('Files uploaded:', result.documentNames);
            setSuccessAlertTitle('Document uploaded successfully!');
            setSuccessAlertMessage('Documents have been uploaded to your repo to be referenced in the knowledge submission.');
            setSuccessAlertLink(result.prUrl);
            setIsSuccessAlertVisible(true);
            setUseFileUpload(false); // Switch back to manual mode to display the newly created values in the knowledge submission
          } else {
            throw new Error(result.error || 'Failed to upload document');
          }
        } catch (error: unknown) {
          if (error instanceof Error) {
            setFailureAlertTitle('Failed to upload document');
            setFailureAlertMessage(error.message);
            setIsFailureAlertVisible(true);
          }
        }
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

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader titleText={{ text: 'Document Info', id: 'doc-info-id' }} titleDescription="Add the relevant document's information" />
        }
      >
        <FormGroup>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button
              variant={useFileUpload ? 'primary' : 'secondary'}
              className={useFileUpload ? 'button-active' : 'button-secondary'}
              onClick={() => setUseFileUpload(true)}
            >
              Automatically Upload Documents
            </Button>
            <Button
              variant={useFileUpload ? 'secondary' : 'primary'}
              className={!useFileUpload ? 'button-active' : 'button-secondary'}
              onClick={() => setUseFileUpload(false)}
            >
              Manually Enter Document Details
            </Button>
          </div>
        </FormGroup>

        {!useFileUpload ? (
          <FormGroup key={'doc-info-details-id'}>
            <TextInput
              isRequired
              type="url"
              aria-label="repo"
              placeholder="Enter repo url where document exists"
              value={repo}
              onChange={(_event, value) => setRepo(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label="commit"
              placeholder="Enter the commit sha of the document in that repo"
              value={commit}
              onChange={(_event, value) => setCommit(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label="patterns"
              placeholder="Enter the documents name (comma separated)"
              value={patterns}
              onChange={(_event, value) => setPatterns(value)}
            />
          </FormGroup>
        ) : (
          <>
            <UploadFile onFilesChange={handleFilesChange} />
            <Button variant="primary" onClick={handleDocumentUpload}>
              Submit Files
            </Button>
          </>
        )}
      </FormFieldGroupExpandable>

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Attribution Info', id: 'attribution-info-id' }}
            titleDescription="Provide attribution information."
          />
        }
      >
        <FormGroup isRequired key={'attribution-info-details-id'}>
          <TextInput
            isRequired
            type="text"
            aria-label="title_work"
            placeholder="Enter title of work"
            value={title_work}
            onChange={(_event, value) => setTitleWork(value)}
          />
          <TextInput
            isRequired
            type="url"
            aria-label="link_work"
            placeholder="Enter link to work"
            value={link_work}
            onChange={(_event, value) => setLinkWork(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="revision"
            placeholder="Enter document revision information"
            value={revision}
            onChange={(_event, value) => setRevision(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="license_work"
            placeholder="Enter license of the work"
            value={license_work}
            onChange={(_event, value) => setLicenseWork(value)}
          />
          <TextInput
            isRequired
            type="text"
            aria-label="creators"
            placeholder="Enter creators Name"
            value={creators}
            onChange={(_event, value) => setCreators(value)}
          />
        </FormGroup>
      </FormFieldGroupExpandable>
      {isSuccessAlertVisible && (
        <Alert
          variant="success"
          title={success_alert_title}
          actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
          actionLinks={
            <>
              <AlertActionLink component="a" href={successAlertLink} target="_blank" rel="noopener noreferrer">
                View it here
              </AlertActionLink>
            </>
          }
        >
          {success_alert_message}
        </Alert>
      )}
      {isFailureAlertVisible && (
        <Alert variant="danger" title={failure_alert_title} actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}>
          {failure_alert_message}
        </Alert>
      )}

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
