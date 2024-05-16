import React, { useState } from 'react';
import './Knowledge.css';
import { usePostKnowledgePR } from "@app/common/HooksPostKnowledgePR";
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form'
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert'
import { AlertActionCloseButton } from '@patternfly/react-core/dist/dynamic/components/Alert'
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button'
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form'
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form'
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text'
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea'
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput'

export const KnowledgeForm: React.FunctionComponent = () => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [task_description, setTaskDescription] = useState('');
  const [task_details, setTaskDetails] = useState('');
  const [domain, setDomain] = useState('');

  const [repo, setRepo] = useState('');
  const [commit, setCommit] = useState('');
  const [patterns, setPatterns] = useState('');

  const [title_work, setTitleWork] = useState('');
  const [link_work, setLinkWork] = useState('');
  const [revision, setRevision] = useState('');
  const [license_work, setLicenseWork] = useState('');
  const [creators, setCreators] = useState('');

  const [questions, setQuestions] = useState<string[]>(new Array(5).fill(''));
  const [answers, setAnswers] = useState<string[]>(new Array(5).fill(''));
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [isFailureAlertVisible, setIsFailureAlertVisible] = useState(false);

  const [failure_alert_title, setFailureAlertTitle] = useState('');
  const [failure_alert_message, setFailureAlertMessage] = useState('');

  const [success_alert_title, setSuccessAlertTitle] = useState('');
  const [success_alert_message, setSuccessAlertMessage] = useState('');


  const { postKnowledgePR } = usePostKnowledgePR();

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

  const resetForm = () => {
    setEmail('');
    setName('');

    setTaskDescription('');
    setTaskDetails('');
    setDomain('');
    setQuestions(new Array(5).fill(''));
    setAnswers(new Array(5).fill(''));

    setRepo('');
    setCommit('');
    setPatterns('');

    setTitleWork('');
    setLinkWork('');
    setLicenseWork('');
    setCreators('');
    setRevision('');
  };

  const onCloseSuccessAlert = () => {
    setSuccessAlertTitle('Knowledge contribution submitted successfully!');
    setSuccessAlertMessage('Thank you for your contribution!!');
    setIsSuccessAlertVisible(false);
  };

  const onCloseFailureAlert = () => {
    setFailureAlertTitle('Failed to submit your Knowledge contribution!');
    setFailureAlertMessage('Please try again later.');
    setIsFailureAlertVisible(false);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    // Make sure all questions and answers are filled
    if (questions.some((question) => question === '') || answers.some((answer) => answer === '')) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the questions and answers are filled!');
      setIsFailureAlertVisible(true);
      return;
    }

    // Make sure all the info fields are filled
    if (
      email === '' ||
      name === '' ||
      task_description === '' ||
      task_details === '' ||
      domain === '' ||
      repo === '' ||
      commit === '' ||
      patterns === '') {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the Info fields are filled!');
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

    // Make sure all the attribution fields are filled
    if (
      title_work === '' ||
      link_work === '' ||
      revision === '' ||
      license_work === '' ||
      creators === ''
    ) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the Attribution fields are filled!');
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

    const uniqueAnswer = new Set(answers);
    if (uniqueAnswer.size !== answers.length) {
      setFailureAlertTitle('Something went wrong!');
      setFailureAlertMessage('Please make sure all the answers are unique!');
      setIsFailureAlertVisible(true);
      return;
    }

    const [res, err] = await postKnowledgePR({
      name: name,
      email: email,
      task_description: task_description,
      task_details: task_details,
      repo: repo,
      commit: commit,
      patterns: patterns,
      title_work: title_work,
      link_work: link_work,
      revision: revision,
      license_work: license_work,
      creators: creators,
      domain: domain,
      questions,
      answers,
    });

    if (err !== null) {
      setFailureAlertTitle('Failed to submit your Knowledge contribution!');
      setFailureAlertMessage(err);
      setIsFailureAlertVisible(true);
      return;
    }

    if (res !== null) {
      setSuccessAlertTitle('Knowledge contribution submitted successfully!');
      setSuccessAlertMessage(res)
      setIsSuccessAlertVisible(true);
      resetForm();
    }
    console.log('Knowledge submitted successfully : ' + res);
  };

  return (
    <div className='main-k'>
      {isSuccessAlertVisible && (
        <Alert
          variant="success"
          title={success_alert_title}
          actionClose={<AlertActionCloseButton onClose={onCloseSuccessAlert} />}
        >
          {success_alert_message}
        </Alert>
      )}
      {isFailureAlertVisible && (
        <Alert
          variant="danger"
          title={failure_alert_title}
          actionClose={<AlertActionCloseButton onClose={onCloseFailureAlert} />}
        >
          {failure_alert_message}
        </Alert>
      )}
      <div className='dataarea-k'>
        <div className='knowledge-k'>
          <Form >
            <Text className='title-k'>Contribute a Knowledge</Text>
            {[...Array(5)].map((_, index) => (
              <FormGroup key={index}>
                <Text className='heading-k'> Example : {index + 1}</Text>
                <TextArea
                  isRequired
                  type="text"
                  aria-label={`Question ${index + 1}`}
                  placeholder="Please enter the question"
                  value={questions[index]}
                  onChange={(_event, value) => handleInputChange(index, 'question', value)}
                />
                <TextArea
                  isRequired
                  type="text"
                  aria-label={`Answer ${index + 1}`}
                  placeholder="Please enter the answer"
                  value={answers[index]}
                  onChange={(_event, value) => handleInputChange(index, 'answer', value)}
                />
              </FormGroup>
            ))}
          </Form>
        </div>
        <div className='metadata-k'>
          <div className='document-k'>
            <Text className='title-k'>Document</Text>
            <TextInput
              isRequired
              type="url"
              aria-label='repo'
              placeholder="Enter your repo url"
              value={repo}
              onChange={(_event, value) => setRepo(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='commit'
              placeholder="Enter the commit sha of the document in the repo"
              value={commit}
              onChange={(_event, value) => setCommit(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='patterns'
              placeholder="Enter the documents name (comma separated)"
              value={patterns}
              onChange={(_event, value) => setPatterns(value)}
            />
          </div>
          <div className='info-k'>
            <Text className='title-k'>Info</Text>
            <TextInput
              isRequired
              type="email"
              aria-label='email'
              placeholder="Enter your email address"
              value={email}
              onChange={(_event, value) => setEmail(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='name'
              placeholder="Enter your name"
              value={name}
              onChange={(_event, value) => setName(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='task_description'
              placeholder="Enter brief description of the knowledge"
              value={task_description}
              onChange={(_event, value) => setTaskDescription(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='domain'
              placeholder="Enter domain information"
              value={domain}
              onChange={(_event, value) => setDomain(value)}
            />
            <TextArea
              isRequired
              type="text"
              aria-label='task_details'
              placeholder="Please provide details about the knowledge"
              value={task_details}
              onChange={(_event, value) => setTaskDetails(value)}
            />
          </div>
          <div className='attribution-k'>
            <Text className='title-k'>Attributions</Text>
            <TextInput
              isRequired
              type="text"
              aria-label='title_work'
              placeholder="Enter title of work"
              value={title_work}
              onChange={(_event, value) => setTitleWork(value)}
            />
            <TextInput
              isRequired
              type="url"
              aria-label='link_work'
              placeholder="Link to work"
              value={link_work}
              onChange={(_event, value) => setLinkWork(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='revision'
              placeholder="Enter document revision information"
              value={revision}
              onChange={(_event, value) => setRevision(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='license_work'
              placeholder="License of the work"
              value={license_work}
              onChange={(_event, value) => setLicenseWork(value)}
            />
            <TextInput
              isRequired
              type="text"
              aria-label='creators'
              placeholder="Creators Name"
              value={creators}
              onChange={(_event, value) => setCreators(value)}
            />
          </div>
        </div>
      </div>
      <div className='submit-k'>
        <ActionGroup>
          <Button variant="primary" type="submit" className="submit-button" onClick={handleSubmit} >Submit</Button>
        </ActionGroup>
      </div>
    </div>
  );
};
