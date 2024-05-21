// src/components/Contribute/Skill/index.tsx
'use client';
import React, { useState } from 'react';
import './skill.css';
import { usePostSkillPR } from '../../../common/HooksPostSkillPR';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { ActionGroup, FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';

export const SkillForm: React.FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [task_description, setTaskDescription] = useState('');
  const [task_details, setTaskDetails] = useState('');

  const [title_work, setTitleWork] = useState('');
  const [link_work, setLinkWork] = useState('');
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

  const { postSkillPR } = usePostSkillPR();

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

  const resetForm = () => {
    setQuestions(new Array(5).fill(''));
    setContexts(new Array(5).fill(''));
    setAnswers(new Array(5).fill(''));
    setEmail('');
    setName('');
    setTaskDescription('');
    setTaskDetails('');
    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
  };

  const onCloseSuccessAlert = () => {
    setSuccessAlertTitle('Skill contribution submitted successfully!');
    setSuccessAlertMessage('Thank you for your contribution!!');
    setIsSuccessAlertVisible(false);
  };

  const onCloseFailureAlert = () => {
    setFailureAlertTitle('Failed to submit your Skill contribution!');
    setFailureAlertMessage('Please try again later.');
    setIsFailureAlertVisible(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    // Hide the existing alerts if any
    setIsSuccessAlertVisible(false);
    setIsFailureAlertVisible(false);

    // Make sure all the questions, contexts and answers are not empty
    if (questions.some((question) => question.trim() === '') || answers.some((answer) => answer.trim() === '')) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the questions and answers are not empty!');
      setIsFailureAlertVisible(true);
      return;
    }

    // Make sure all the questions are unique
    const uniqueQuestions = new Set(questions);
    if (uniqueQuestions.size !== questions.length) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the questions are unique!');
      setIsFailureAlertVisible(true);
      return;
    }

    const uniqueContext = new Set(contexts);
    if (uniqueContext.size !== contexts.length) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the contexts are unique!');
      setIsFailureAlertVisible(true);
      return;
    }

    const uniqueAnswer = new Set(answers);
    if (uniqueAnswer.size !== answers.length) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the answers are unique!');
      setIsFailureAlertVisible(true);
      return;
    }

    // Make sure email, name, task_description, task_details, title_work, link_work, license_work, creators are not empty
    if (email.trim() === '' || name.trim() === '' || task_description.trim() === '' || task_details.trim() === '') {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the Info fields are not empty!');
      setIsFailureAlertVisible(true);
      return;
    }

    // Make sure email has a valid format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    if (!emailRegex.test(email)) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please enter a valid email address!');
      setIsFailureAlertVisible(true);
      return;
    }

    // Make sure all the Attribution fields are not empty
    if (title_work.trim() === '' || link_work.trim() === '' || license_work.trim() === '' || creators.trim() === '') {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the Attribution fields are not empty!');
      setIsFailureAlertVisible(true);
      return;
    }

    const [res, err] = await postSkillPR({
      name: name,
      email: email,
      task_description: task_description,
      task_details: task_details,
      title_work: title_work,
      link_work: link_work,
      license_work: license_work,
      creators: creators,
      questions,
      contexts,
      answers,
    });

    if (err !== null) {
      setFailureAlertTitle('Failed to submit your Skill contribution!');
      setFailureAlertMessage(err);
      setIsFailureAlertVisible(true);
      return;
    }

    if (res !== null) {
      setSuccessAlertTitle('Skill contribution submitted successfully!');
      setSuccessAlertMessage(res);
      setIsSuccessAlertVisible(true);
      resetForm();
    }
    console.log('Skill submitted successfully ' + res);
  };

  return (
    <Form className="form">
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
        {[...Array(5)].map((_, index) => (
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
              placeholder="Enter the context"
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
          </FormGroup>
        ))}
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
        <Alert variant="success" title={success_alert_title} actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}>
          {success_alert_message}
        </Alert>
      )}
      {isFailureAlertVisible && (
        <Alert variant="danger" title={failure_alert_title} actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}>
          {failure_alert_message}
        </Alert>
      )}
      <ActionGroup>
        <Button variant="primary" type="submit" className="submit" onClick={handleSubmit}>
          Submit
        </Button>
      </ActionGroup>
    </Form>
  );
};
