// src/components/Contribute/Skill/index.tsx
'use client';
import React, { useState, useEffect } from 'react';
import './skill.css';
import { Alert, AlertActionLink, AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup, FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { PlusIcon, MinusCircleIcon, CodeIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { validateFields, validateEmail, validateUniqueItems } from '../../../utils/validation';
import yaml from 'js-yaml';
import { getGitHubUsername } from '../../../utils/github';
import { useSession } from 'next-auth/react';
import YamlCodeModal from '../../YamlCodeModal';
import { SchemaVersion } from '@/types';

export const SkillForm: React.FunctionComponent = () => {
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

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [task_description, setTaskDescription] = useState('');
  const [submission_summary, setSubmissionSummary] = useState('');

  const [title_work, setTitleWork] = useState('');
  const [link_work, setLinkWork] = useState('-');
  const [license_work, setLicenseWork] = useState('');
  const [creators, setCreators] = useState('');

  const [questions, setQuestions] = useState<string[]>(new Array(5).fill(''));
  const [contexts, setContexts] = useState<string[]>(new Array(5).fill(''));
  const [answers, setAnswers] = useState<string[]>(new Array(5).fill(''));
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = useState(false);

  const [failure_alert_title, setFailureAlertTitle] = useState('');
  const [failure_alert_message, setFailureAlertMessage] = useState('');

  const [success_alert_title, setSuccessAlertTitle] = useState('');
  const [success_alert_message, setSuccessAlertMessage] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [yamlContent, setYamlContent] = useState('');

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

  const resetForm = () => {
    setQuestions(new Array(5).fill(''));
    setContexts(new Array(5).fill(''));
    setAnswers(new Array(5).fill(''));
    setEmail('');
    setName('');
    setTaskDescription('');
    setSubmissionSummary('');
    setTitleWork('');
    setLinkWork('-');
    setLicenseWork('');
    setCreators('');
  };

  const onCloseSuccessAlert = () => {
    setIsSuccessAlertVisible(false);
  };

  const onCloseFailureAlert = () => {
    setIsFailureAlertVisible(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const infoFields = { email, name, task_description, submission_summary };
    const attributionFields = { title_work, link_work, license_work, creators };

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

    validation = validateEmail(email);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

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

    const skillData = {
      name: name,
      email: email,
      task_description: task_description,
      submission_summary: submission_summary,
      title_work: title_work,
      link_work: link_work,
      license_work: license_work,
      creators: creators,
      questions,
      contexts,
      answers
    };

    try {
      const response = await fetch('/api/pr/skill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(skillData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit skill data');
      }

      const result = await response.json();
      setSuccessAlertTitle('Skill contribution submitted successfully!');
      setSuccessAlertMessage(result.html_url);
      setIsSuccessAlertVisible(true);
      resetForm();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setFailureAlertTitle('Failed to submit your Skill contribution!');
        setFailureAlertMessage(error.message);
        setIsFailureAlertVisible(true);
      }
    }
  };

  const handleViewYaml = () => {
    const yamlData = {
      created_by: githubUsername,
      version: SchemaVersion,
      task_description: task_description,
      seed_examples: questions.map((question, index) => ({
        question,
        answer: answers[index],
        context: contexts[index] || ''
      }))
    };

    const yamlString = yaml.dump(yamlData, { lineWidth: -1 });
    setYamlContent(yamlString);
    setIsModalOpen(true);
  };

  const handleDownloadYaml = () => {
    const infoFields = { email, name, task_description, submission_summary };
    const attributionFields = { title_work, link_work: '-', revision: '-', license_work, creators };

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

    validation = validateEmail(email);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

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

    interface SeedExample {
      question: string;
      answer: string;
      context?: string;
    }

    const yamlData = {
      created_by: githubUsername,
      version: SchemaVersion,
      task_description: task_description,
      seed_examples: questions.map((question, index) => {
        const example: SeedExample = {
          question,
          answer: answers[index]
        };
        if (contexts[index]?.trim() !== '') {
          example.context = contexts[index];
        }
        return example;
      })
    };

    const yamlString = yaml.dump(yamlData, { lineWidth: -1 });
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skill.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadAttribution = () => {
    const attributionFields = { title_work, link_work: '-', revision: '-', license_work, creators };

    const validation = validateFields(attributionFields);
    if (!validation.valid) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage(validation.message);
      setIsFailureAlertVisible(true);
      return;
    }

    const attributionContent = `Title of work: ${title_work}
  Link to work: -
  Revision: -
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

  return (
    <Form className="form">
      <YamlCodeModal isModalOpen={isModalOpen} handleModalToggle={() => setIsModalOpen(!isModalOpen)} yamlContent={yamlContent} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <FormFieldGroupHeader titleText={{ text: 'Skill Contribution Form', id: 'skill-contribution-form-id' }} />
        <Button variant="plain" onClick={handleViewYaml} aria-label="View YAML">
          <CodeIcon /> View YAML
        </Button>
      </div>
      <FormFieldGroupExpandable
        isExpanded
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Author Info', id: 'author-info-id' }}
            titleDescription="Provide your information required for a GitHub DCO sign-off."
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
          <FormFieldGroupHeader titleText={{ text: 'Skill Info', id: 'skill-info-id' }} titleDescription="Provide information about the skill." />
        }
      >
        <FormGroup key={'skill-info-details-id'}>
          <TextInput
            isRequired
            type="text"
            aria-label="submission_summary"
            placeholder="Enter a brief description for a submission summary (60 character max)"
            value={submission_summary}
            onChange={(_event, value) => setSubmissionSummary(value)}
            maxLength={60}
          />
          <TextArea
            isRequired
            type="text"
            aria-label="task_description"
            placeholder="Enter a detailed description to improve the teacher model's responses"
            value={task_description}
            onChange={(_event, value) => setTaskDescription(value)}
          />
        </FormGroup>
      </FormFieldGroupExpandable>

      <FormFieldGroupExpandable
        toggleAriaLabel="Details"
        header={
          <FormFieldGroupHeader
            titleText={{ text: 'Skill', id: 'contrib-skill-id' }}
            titleDescription="Contribute skill to the taxonomy repository (shift+enter for a new line)."
          />
        }
      >
        {questions.map((question, index) => (
          <FormGroup key={index}>
            <Text className="heading"> Example : {index + 1}</Text>
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
      {isSuccessAlertVisible && (
        <Alert
          variant="success"
          title={success_alert_title}
          actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
          actionLinks={
            <AlertActionLink component="a" href={success_alert_message} target="_blank" rel="noopener noreferrer">
              View your pull request
            </AlertActionLink>
          }
        >
          Thank you for your contribution!
        </Alert>
      )}
      {isFailureAlertVisible && (
        <Alert variant="danger" title={failure_alert_title} actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}>
          {failure_alert_message}
        </Alert>
      )}
      <ActionGroup>
        <Button variant="primary" type="submit" className="submit" onClick={handleSubmit}>
          Submit Skill
        </Button>
        <Button variant="primary" type="button" className="download-yaml" onClick={handleDownloadYaml}>
          Download YAML
        </Button>
        <Button variant="primary" type="button" className="download-attribution" onClick={handleDownloadAttribution}>
          Download Attribution
        </Button>
      </ActionGroup>
    </Form>
  );
};
