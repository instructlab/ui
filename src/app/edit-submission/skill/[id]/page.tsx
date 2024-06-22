// src/app/edit-submission/skill/[id]/page.tsx
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
import {
  fetchPullRequest,
  fetchFileContent,
  updatePullRequest,
  fetchPullRequestFiles,
  getGitHubUsername,
  amendCommit
} from '../../../../utils/github';
import yaml from 'js-yaml';

interface YamlData {
  created_by: string;
  task_description: string;
  seed_examples: Array<{
    question: string;
    context?: string;
    answer: string;
  }>;
}

interface AttributionData {
  title_of_work: string;
  link_to_work: string;
  revision: string;
  license_of_the_work: string;
  creator_names: string;
}

const EditSkillPage: React.FunctionComponent<{ params: { id: string } }> = ({ params }) => {
  const { data: session } = useSession();
  const [title, setTitle] = React.useState('');
  const [body, setBody] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [name, setName] = React.useState('');
  const [task_description, setTaskDescription] = React.useState('');
  const [task_details, setTaskDetails] = React.useState('');
  const [title_work, setTitleWork] = React.useState('');
  const [link_work, setLinkWork] = React.useState('-');
  const [license_work, setLicenseWork] = React.useState('');
  const [creators, setCreators] = React.useState('');
  const [questions, setQuestions] = React.useState<string[]>([]);
  const [contexts, setContexts] = React.useState<string[]>([]);
  const [answers, setAnswers] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [yamlFile, setYamlFile] = React.useState<{ filename: string } | null>(null);
  const [attributionFile, setAttributionFile] = React.useState<{ filename: string } | null>(null);
  const [branchName, setBranchName] = React.useState<string | null>(null);
  const router = useRouter();
  const { id: number } = params;

  // Alerts
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = React.useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = React.useState(false);
  const [failureAlertTitle, setFailureAlertTitle] = React.useState('');
  const [failureAlertMessage, setFailureAlertMessage] = React.useState('');
  const [successAlertTitle, setSuccessAlertTitle] = React.useState('');
  const [successAlertMessage, setSuccessAlertMessage] = React.useState<React.ReactNode>('');
  const [successAlertLink, setSuccessAlertLink] = React.useState<string>('');

  React.useEffect(() => {
    console.log('Params:', params); // Log the params to verify its content
    const fetchPRData = async () => {
      if (session?.accessToken) {
        try {
          console.log(`Fetching PR with number: ${number}`);
          const prData = await fetchPullRequest(session.accessToken, number);
          console.log(`Fetched PR data:`, prData);
          setTitle(prData.title);
          setBody(prData.body);
          setBranchName(prData.head.ref); // Store the branch name from the pull request

          const prFiles = await fetchPullRequestFiles(session.accessToken, number);
          console.log(`Fetched PR files:`, prFiles);

          const foundYamlFile = prFiles.find((file) => file.filename.endsWith('.yaml'));
          if (!foundYamlFile) {
            throw new Error('No YAML file found in the pull request.');
          }
          setYamlFile(foundYamlFile);
          console.log(`YAML file found:`, foundYamlFile);

          const yamlContent = await fetchFileContent(session.accessToken, foundYamlFile.filename, prData.head.sha);
          console.log('Fetched YAML content:', yamlContent);
          const yamlData: YamlData = yaml.load(yamlContent);
          console.log('Parsed YAML data:', yamlData);

          // Populate the form fields with YAML data
          setEmail(yamlData.created_by);
          setTaskDescription(yamlData.task_description);
          setQuestions(yamlData.seed_examples.map((example) => example.question));
          setContexts(yamlData.seed_examples.map((example) => example.context || ''));
          setAnswers(yamlData.seed_examples.map((example) => example.answer));

          // Fetch and parse attribution file if it exists
          const foundAttributionFile = prFiles.find((file) => file.filename.includes('attribution'));
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
            setLicenseWork(attributionData.license_of_the_work);
            setCreators(attributionData.creator_names);
          }
        } catch (error) {
          console.error('Error fetching pull request data:', error.response ? error.response.data : error.message);
          setError(`Failed to fetch pull request data: ${error.message}`);
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

        const updatedYamlData: YamlData = {
          created_by: email,
          task_description,
          seed_examples: questions.map((question, index) => ({
            question,
            context: contexts[index],
            answer: answers[index]
          }))
        };
        const updatedYamlContent = yaml.dump(updatedYamlData, { lineWidth: -1 });

        console.log('Updated YAML content:', updatedYamlContent);

        const updatedAttributionContent = `Title of work: ${title_work}
Link to work: ${link_work}
Revision: ${task_details}
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

        const prLink = `https://github.com/brents-pet-robot/taxonomy-sub-testing/pull/${number}`;
        setSuccessAlertTitle('Pull request updated successfully!');
        setSuccessAlertMessage('Your pull request has been updated successfully.');
        setSuccessAlertLink(prLink);
        setIsSuccessAlertVisible(true);
      } catch (error) {
        console.error('Error updating pull request:', error.response ? error.response.data : error.message);
        setFailureAlertTitle('Failed to update pull request');
        setFailureAlertMessage(error.message);
        setIsFailureAlertVisible(true);
      }
    } else {
      setFailureAlertTitle('Error');
      setFailureAlertMessage('YAML file, Attribution file, or branch name is missing.');
      setIsFailureAlertVisible(true);
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
      case 'context':
        setContexts((prevContexts) => {
          const updatedContexts = [...prevContexts];
          updatedContexts[index] = value;
          return updatedContexts;
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
    setContexts([...contexts, '']);
    setAnswers([...answers, '']);
  };

  const deleteQuestionAnswerPair = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
    setContexts(contexts.filter((_, i) => i !== index));
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
    return attributionData as AttributionData;
  };

  return (
    <AppLayout>
      <PageSection>
        <Title headingLevel="h1" size="lg">
          Edit Pull Request
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
              <FormFieldGroupHeader
                titleText={{ text: 'Author Info', id: 'author-info-id' }}
                titleDescription="Provide your information. Needed for GitHub DCO sign-off."
              />
            }
          >
            <FormGroup isRequired key={'author-info-details-id'}>
              <TextInput
                isRequired
                type="email"
                aria-label="email"
                placeholder="Enter your email address"
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
                titleText={{ text: 'Skill Info', id: 'skill-info-id' }}
                titleDescription="Provide brief information about the skill."
              />
            }
          >
            <FormGroup key={'skill-info-details-id'}>
              <TextInput
                isRequired
                type="text"
                aria-label="task_description"
                placeholder="Enter brief description of the skill"
                value={task_description}
                onChange={(_event, value) => setTaskDescription(value)}
              />
              <TextArea
                isRequired
                type="text"
                aria-label="task_details"
                placeholder="Provide details about the skill"
                value={task_details}
                onChange={(_event, value) => setTaskDetails(value)}
              />
            </FormGroup>
          </FormFieldGroupExpandable>

          <FormFieldGroupExpandable
            toggleAriaLabel="Details"
            header={
              <FormFieldGroupHeader
                titleText={{ text: 'Skill', id: 'contrib-skill-id' }}
                titleDescription="Contribute new skill to the taxonomy repository."
              />
            }
          >
            {questions.map((question, index) => (
              <FormGroup key={index}>
                <Text component="h6" className="heading">
                  {' '}
                  Example : {index + 1}
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
                  type="text"
                  aria-label={`Context ${index + 1}`}
                  placeholder="Enter the context (Optional)"
                  value={contexts[index]}
                  onChange={(_event, value) => handleInputChange(index, 'context', value)}
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
              Save
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

export default EditSkillPage;
