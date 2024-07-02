// src/app/edit-submission/knowledge/[id]/page.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { PlusIcon, MinusCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { AppLayout } from '../../../../components/AppLayout';
import { UploadFile } from '../../../../components/Contribute/Knowledge/UploadFile';
import { AttributionData, PullRequestFile, KnowledgeYamlData, SchemaVersion } from '@/types';
import {
  fetchPullRequest,
  fetchFileContent,
  updatePullRequest,
  fetchPullRequestFiles,
  getGitHubUsername,
  amendCommit
} from '../../../../utils/github';
import yaml from 'js-yaml';
import axios from 'axios';

const EditPullRequestPage: React.FunctionComponent<{ params: { id: string } }> = ({ params }) => {
  const { data: session } = useSession();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [task_description, setTaskDescription] = React.useState('');
  const [domain, setDomain] = React.useState('');
  const [repo, setRepo] = React.useState('');
  const [commit, setCommit] = React.useState('');
  const [patterns, setPatterns] = React.useState('');
  const [title_work, setTitleWork] = React.useState('');
  const [link_work, setLinkWork] = React.useState('');
  const [revision, setRevision] = React.useState('');
  const [license_work, setLicenseWork] = React.useState('');
  const [creators, setCreators] = React.useState('');
  const [questions, setQuestions] = React.useState<string[]>([]);
  const [answers, setAnswers] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [yamlFile, setYamlFile] = React.useState<PullRequestFile | null>(null);
  const [attributionFile, setAttributionFile] = React.useState<PullRequestFile | null>(null);
  const [branchName, setBranchName] = React.useState<string | null>(null);
  const [useFileUpload, setUseFileUpload] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<File[]>([]);
  const router = useRouter();
  const number = parseInt(params.id, 10);

  // Alerts
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = React.useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = React.useState(false);
  const [failureAlertTitle, setFailureAlertTitle] = React.useState('');
  const [failureAlertMessage, setFailureAlertMessage] = React.useState('');
  const [successAlertTitle, setSuccessAlertTitle] = React.useState('');
  const [successAlertMessage, setSuccessAlertMessage] = React.useState<React.ReactNode>('');
  const [successAlertLink, setSuccessAlertLink] = React.useState<string>('');

  React.useEffect(() => {
    console.log('Params:', params);
    const fetchPRData = async () => {
      if (session?.accessToken) {
        try {
          console.log(`Fetching PR with number: ${number}`);
          const prData = await fetchPullRequest(session.accessToken, number);
          console.log(`Fetched PR data:`, prData);
          setTitle(prData.title);
          setBody(prData.body);
          setBranchName(prData.head.ref); // Store the branch name from the pull request

          const prFiles: PullRequestFile[] = await fetchPullRequestFiles(session.accessToken, number);
          console.log(`Fetched PR files:`, prFiles);

          const foundYamlFile = prFiles.find((file: PullRequestFile) => file.filename.endsWith('.yaml'));
          if (!foundYamlFile) {
            throw new Error('No YAML file found in the pull request.');
          }
          setYamlFile(foundYamlFile);
          console.log(`YAML file found:`, foundYamlFile);

          const yamlContent = await fetchFileContent(session.accessToken, foundYamlFile.filename, prData.head.sha);
          console.log('Fetched YAML content:', yamlContent);
          const yamlData: KnowledgeYamlData = yaml.load(yamlContent) as KnowledgeYamlData;
          console.log('Parsed YAML data:', yamlData);

          // Populate the form fields with YAML data
          setEmail(yamlData.created_by);
          setTaskDescription(yamlData.task_description);
          setDomain(yamlData.domain);
          setRepo(yamlData.document.repo);
          setCommit(yamlData.document.commit);
          setPatterns(yamlData.document.patterns.join(', '));
          setQuestions(yamlData.seed_examples.map((example) => example.question));
          setAnswers(yamlData.seed_examples.map((example) => example.answer));

          // Fetch and parse attribution file if it exists
          const foundAttributionFile = prFiles.find((file: PullRequestFile) => file.filename.includes('attribution'));
          if (foundAttributionFile) {
            setAttributionFile(foundAttributionFile);
            console.log(`Attribution file found:`, foundAttributionFile);
            const attributionContent = await fetchFileContent(session.accessToken, foundAttributionFile.filename, prData.head.sha);
            console.log('Fetched attribution content:', attributionContent);
            const attributionData = parseAttributionContent(attributionContent);
            console.log('Parsed attribution data:', attributionData);

            // Populate the form fields with attribution data
            setTitleWork(attributionData.title_of_work);
            setLinkWork(attributionData.link_to_work);
            setRevision(attributionData.revision);
            setLicenseWork(attributionData.license_of_the_work);
            setCreators(attributionData.creator_names);
          }
        } catch (error) {
          if (axios.isAxiosError(error)) {
            console.error('Error fetching pull request data:', error.response ? error.response.data : error.message);
            setError(`Failed to fetch pull request data: ${error.message}`);
          } else if (error instanceof Error) {
            console.error('Error fetching pull request data:', error.message);
            setError(`Failed to fetch pull request data: ${error.message}`);
          }
        }
      }
    };
    fetchPRData();
  }, [session, number, params]);

  const handleSave = async () => {
    if (session?.accessToken && yamlFile && attributionFile && branchName) {
      try {
        console.log(`Updating PR with number: ${number}`);
        await updatePullRequest(session.accessToken, number, { title, body });

        const githubUsername = await getGitHubUsername(session.accessToken);
        console.log(`GitHub username: ${githubUsername}`);

        const updatedYamlData: KnowledgeYamlData = {
          created_by: email,
          version: SchemaVersion,
          domain,
          task_description,
          document: {
            repo,
            commit,
            patterns: patterns.split(',').map((pattern) => pattern.trim())
          },
          seed_examples: questions.map((question, index) => ({
            question,
            answer: answers[index]
          }))
        };
        const updatedYamlContent = yaml.dump(updatedYamlData, {
          lineWidth: -1,
          noCompatMode: true,
          quotingType: '"'
        });

        console.log('Updated YAML content:', updatedYamlContent);

        const updatedAttributionContent = `Title of work: ${title_work}
Link to work: ${link_work}
Revision: ${revision}
License of the work: ${license_work}
Creator names: ${creators}
`;

        console.log('Updated Attribution content:', updatedAttributionContent);

        // Update the commit by amending it with the new content
        console.log(`Amending commit with updated content`);
        const amendedCommitResponse = await amendCommit(
          session.accessToken,
          githubUsername,
          'taxonomy-sub-testing',
          { yaml: yamlFile.filename, attribution: attributionFile.filename },
          updatedYamlContent,
          updatedAttributionContent,
          branchName
        );
        console.log('Amended commit response:', amendedCommitResponse);

        const prLink = `https://github.com/${process.env.NEXT_PUBLIC_TAXONOMY_REPO_OWNER}/${process.env.NEXT_PUBLIC_TAXONOMY_REPO}/pull/${number}`;
        setSuccessAlertTitle('Pull request updated successfully!');
        setSuccessAlertMessage('Your pull request has been updated successfully.');
        setSuccessAlertLink(prLink);
        setIsSuccessAlertVisible(true);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error updating pull request:', error.response ? error.response.data : error.message);
          setFailureAlertTitle('Failed to update pull request');
          setFailureAlertMessage(error.message);
          setIsFailureAlertVisible(true);
        } else if (error instanceof Error) {
          console.error('Error updating pull request:', error.message);
          setFailureAlertTitle('Failed to update pull request');
          setFailureAlertMessage(error.message);
          setIsFailureAlertVisible(true);
        }
      }
    } else {
      setFailureAlertTitle('Error');
      setFailureAlertMessage('YAML file, Attribution file, or branch name is missing.');
      setIsFailureAlertVisible(true);
    }
  };

  const handleFilesChange = (files: File[]) => {
    setUploadedFiles(files);
    setPatterns(files.map((file) => file.name).join(', ')); // Populate the patterns field
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

  const handleInputChange = (index: number, type: string, value: string) => {
    switch (type) {
      case 'question':
        setQuestions((prevQuestions) => {
          const updatedQuestions = [...prevQuestions];
          updatedQuestions[index] = value;
          return updatedQuestions;
        });
        break;
      case 'answer':
        setAnswers((prevAnswers) => {
          const updatedAnswers = [...prevAnswers];
          updatedAnswers[index] = value;
          return updatedAnswers;
        });
        break;
      default:
        break;
    }
  };

  const addQuestionAnswerPair = () => {
    setQuestions([...questions, '']);
    setAnswers([...answers, '']);
  };

  const deleteQuestionAnswerPair = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setAnswers(answers.filter((_, i) => i !== index));
  };

  const parseAttributionContent = (content: string): AttributionData => {
    const lines = content.split('\n');
    const attributionData: { [key: string]: string } = {};
    lines.forEach((line) => {
      const [key, ...value] = line.split(':');
      if (key && value) {
        // Remove spaces in the attribution field for parsing
        const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
        attributionData[normalizedKey] = value.join(':').trim();
      }
    });
    return attributionData as unknown as AttributionData;
  };

  return (
    <AppLayout>
      <PageSection>
        <Title headingLevel="h1" size="lg">
          Edit Knowledge Submission
        </Title>
        {error && <Alert variant="danger" title={error} />}
        <Form>
          <FormGroup label="" fieldId="title">
            <TextInput isDisabled type="text" id="title" name="title" value={title} />
          </FormGroup>
          <FormFieldGroupExpandable
            isExpanded
            toggleAriaLabel="Details"
            header={
              <FormFieldGroupHeader titleText={{ text: 'Author Info', id: 'author-info-id' }} titleDescription="Provide your user information." />
            }
          >
            <FormGroup isRequired key={'author-info-details-id'}>
              <TextInput
                isRequired
                type="email"
                aria-label="email"
                placeholder="Enter your github ID"
                value={email}
                onChange={(_event, value) => setEmail(value)}
              />
              <TextInput
                isRequired
                type="text"
                aria-label="name"
                placeholder="Enter your full name"
                value={name}
                onChange={(_event, value) => setName(value)}
              />
            </FormGroup>
          </FormFieldGroupExpandable>

          <FormFieldGroupExpandable
            isExpanded
            toggleAriaLabel="Details"
            header={
              <FormFieldGroupHeader
                titleText={{ text: 'Knowledge Info', id: 'knowledge-info-id' }}
                titleDescription="Provide brief information about the knowledge."
              />
            }
          >
            <FormGroup key={'knowledge-info-details-id'}>
              <TextInput
                isRequired
                type="text"
                aria-label="domain"
                placeholder="Enter domain information"
                value={domain}
                onChange={(_event, value) => setDomain(value)}
              />
              <TextArea
                isRequired
                type="text"
                aria-label="task_description"
                placeholder="Enter brief description of the knowledge"
                value={task_description}
                onChange={(_event, value) => setTaskDescription(value)}
              />
            </FormGroup>
          </FormFieldGroupExpandable>

          <FormFieldGroupExpandable
            toggleAriaLabel="Details"
            header={
              <FormFieldGroupHeader
                titleText={{ text: 'Knowledge', id: 'contrib-knowledge-id' }}
                titleDescription="Contribute knowledge to the taxonomy repository (shift+enter for a new line)."
              />
            }
          >
            {questions.map((question, index) => (
              <FormGroup key={index}>
                <Text component="h6" className="heading-k">
                  {' '}
                  Question and Answer: {index + 1}
                </Text>
                <TextArea
                  isRequired
                  type="text"
                  aria-label={`Question ${index + 1}`}
                  placeholder="Enter the question"
                  value={questions[index]}
                  onChange={(_event, value) => handleInputChange(index, 'question', value)}
                />
                <TextArea
                  isRequired
                  type="text"
                  aria-label={`Answer ${index + 1}`}
                  placeholder="Enter the answer"
                  value={answers[index]}
                  onChange={(_event, value) => handleInputChange(index, 'answer', value)}
                />
                <Button variant="danger" onClick={() => deleteQuestionAnswerPair(index)}>
                  <MinusCircleIcon /> Delete
                </Button>
              </FormGroup>
            ))}
            <Button variant="primary" onClick={addQuestionAnswerPair}>
              <PlusIcon /> Add Question and Answer
            </Button>
          </FormFieldGroupExpandable>

          <FormFieldGroupExpandable
            toggleAriaLabel="Details"
            header={
              <FormFieldGroupHeader
                titleText={{ text: 'Document Info', id: 'doc-info-id' }}
                titleDescription="Add the relevant document's information"
              />
            }
          >
            <FormGroup>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant={useFileUpload ? 'secondary' : 'primary'}
                  className={!useFileUpload ? 'button-active' : 'button-secondary'}
                  onClick={() => setUseFileUpload(false)}
                >
                  Manually Enter Document Details
                </Button>
                <Button
                  variant={useFileUpload ? 'primary' : 'secondary'}
                  className={useFileUpload ? 'button-active' : 'button-secondary'}
                  onClick={() => setUseFileUpload(true)}
                >
                  Automatically Upload Documents
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
          <ActionGroup>
            <Button variant="primary" onClick={handleSave}>
              Update Knowledge Submission
            </Button>
            <Button variant="link" onClick={() => router.back()}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>

        {isSuccessAlertVisible && (
          <Alert
            variant="success"
            title={successAlertTitle}
            actionClose={<AlertActionCloseButton onClose={() => setIsSuccessAlertVisible(false)} />}
            actionLinks={
              <>
                <AlertActionLink component="a" href={successAlertLink} target="_blank" rel="noopener noreferrer">
                  View it here
                </AlertActionLink>
              </>
            }
          >
            {successAlertMessage}
          </Alert>
        )}
        {isFailureAlertVisible && (
          <Alert variant="danger" title={failureAlertTitle} actionClose={<AlertActionCloseButton onClose={() => setIsFailureAlertVisible(false)} />}>
            {failureAlertMessage}
          </Alert>
        )}
      </PageSection>
    </AppLayout>
  );
};

export default EditPullRequestPage;
