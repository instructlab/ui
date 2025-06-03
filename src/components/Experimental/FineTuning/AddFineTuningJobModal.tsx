// src/components/Experimental/FineTuning/index.tsx
'use client';

import React from 'react';
import {
  Modal,
  Form,
  FormGroup,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  NumberInput,
  Button,
  Alert,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Flex,
  FlexItem
} from '@patternfly/react-core';
import { Model, Branch, Job } from '@/components/Experimental/FineTuning/types';

interface Props {
  models: Model[];
  branches: Branch[];
  onClose: (newJob?: Job) => void;
}

const AddFineTuningJobModal: React.FC<Props> = ({ models, branches, onClose }) => {
  const [errorMessage, setErrorMessage] = React.useState<string>(
    !models.length || !branches.length ? 'No data available for creating fine tuning jobs.' : ''
  );

  const [selectedModel, setSelectedModel] = React.useState<string>('');
  const [selectedBranch, setSelectedBranch] = React.useState<string>('');
  const [selectedEpochs, setSelectedEpochs] = React.useState<number | ''>('');

  const [isModelDropdownOpen, setIsModelDropdownOpen] = React.useState<boolean>(false);
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = React.useState<boolean>(false);

  const isValid = !!selectedBranch && !!selectedModel && selectedEpochs;

  const handleGenerateClick = async () => {
    if (!selectedModel || !selectedBranch) {
      setErrorMessage('Please select both a model and a branch.');
      return;
    }
    if (!selectedEpochs) {
      setErrorMessage('Please enter the number of epochs.');
      return;
    }
    try {
      const response = await fetch('/api/fine-tune/data/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: selectedModel, branchName: selectedBranch, epochs: selectedEpochs }), // Include epochs
        cache: 'no-cache'
      });
      const result = await response.json();
      if (response.ok) {
        const newJob: Job = {
          job_id: result.job_id,
          status: 'running',
          type: result.job_id.startsWith('g-') ? 'generate' : result.job_id.startsWith('p-') ? 'pipeline' : 'train',
          start_time: new Date().toISOString()
        };
        onClose(newJob);
      } else {
        setErrorMessage(result.error || 'Failed to start generate job');
      }
    } catch (error) {
      console.error('Error starting generate job:', error);
      setErrorMessage('Error starting generate job');
    }
  };

  const handleTrainClick = async () => {
    if (!selectedModel || !selectedBranch) {
      setErrorMessage('Please select both a model and a branch.');
      return;
    }
    if (!selectedEpochs) {
      setErrorMessage('Please enter the number of epochs.');
      return;
    }

    try {
      console.log('Sending train request with:', {
        modelName: selectedModel,
        branchName: selectedBranch,
        epochs: selectedEpochs
      });

      const response = await fetch('/api/fine-tune/model/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: selectedModel,
          branchName: selectedBranch,
          epochs: selectedEpochs
        }),
        cache: 'no-cache'
      });
      const result = await response.json();
      if (response.ok) {
        const newJob: Job = {
          job_id: result.job_id,
          status: 'running',
          type: result.job_id.startsWith('g-') ? 'generate' : result.job_id.startsWith('p-') ? 'pipeline' : 'train',
          start_time: new Date().toISOString()
        };
        onClose(newJob);
      } else {
        setErrorMessage(result.error || 'Failed to start train job');
      }
    } catch (error) {
      console.error('Error starting train job:', error);
      setErrorMessage('Error starting train job');
    }
  };

  const handlePipelineClick = async () => {
    if (!selectedModel || !selectedBranch) {
      setErrorMessage('Please select both a model and a branch.');
      return;
    }
    if (!selectedEpochs) {
      setErrorMessage('Please enter the number of epochs.');
      return;
    }

    try {
      console.debug('Sending pipeline generate-train request with:', {
        modelName: selectedModel,
        branchName: selectedBranch,
        epochs: selectedEpochs
      });
      const response = await fetch('/api/fine-tune/pipeline/generate-train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelName: selectedModel, branchName: selectedBranch, epochs: selectedEpochs }), // Include epochs
        cache: 'no-cache'
      });
      const result = await response.json();
      if (response.ok && result.pipeline_job_id) {
        // Add the new job to the job list
        const newJob: Job = {
          job_id: result.pipeline_job_id,
          status: 'running',
          type: 'pipeline',
          branch: selectedBranch,
          start_time: new Date().toISOString()
        };
        onClose(newJob);
        console.debug('New pipeline job added:', newJob);
      } else {
        setErrorMessage(result.error || 'Failed to start generate-train pipeline');
        console.warn('Pipeline action failed:', result.error);
      }
    } catch (error) {
      console.error('Error starting generate-train pipeline job:', error);
      setErrorMessage('Error starting generate-train pipeline job');
    }
  };

  return (
    <Modal isOpen onClose={() => onClose()} variant="small">
      <ModalHeader title="Create fine tuning job" />
      <ModalBody>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          {errorMessage ? (
            <FlexItem>
              <Alert className="pf-v6-u-mt-md" variant="danger" title={errorMessage} isInline />
            </FlexItem>
          ) : null}
          <FlexItem>
            <Form>
              <FormGroup label="Select Git Branch" isRequired fieldId="branch-select">
                <Dropdown
                  isOpen={isBranchDropdownOpen}
                  onSelect={(_event, value) => {
                    setSelectedBranch(value as string);
                    setIsBranchDropdownOpen(false);
                  }}
                  onOpenChange={(isOpen) => setIsBranchDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle ref={toggleRef} onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)} isExpanded={isBranchDropdownOpen}>
                      {selectedBranch || 'Select a branch'}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {branches.map((branch) => (
                      <DropdownItem key={branch.name} value={branch.name}>
                        {branch.name}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </FormGroup>

              <FormGroup label="Select Base Model" isRequired fieldId="model-select">
                <Dropdown
                  isOpen={isModelDropdownOpen}
                  onSelect={(_event, value) => {
                    setSelectedModel(value as string);
                    setIsModelDropdownOpen(false);
                  }}
                  onOpenChange={(isOpen) => setIsModelDropdownOpen(isOpen)}
                  toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                    <MenuToggle ref={toggleRef} onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)} isExpanded={isModelDropdownOpen}>
                      {selectedModel || 'Select a model'}
                    </MenuToggle>
                  )}
                >
                  <DropdownList>
                    {models.map((model) => (
                      <DropdownItem key={model.name} value={model.name}>
                        {model.name}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </Dropdown>
              </FormGroup>

              {/* New FormGroup for Epoch Selection using NumberInput */}
              <FormGroup label="Number of Epochs" isRequired fieldId="epochs-input">
                <NumberInput
                  value={selectedEpochs || ''}
                  onMinus={() => {
                    const newValue = typeof selectedEpochs === 'number' ? selectedEpochs - 1 : 0;
                    setSelectedEpochs(newValue >= 1 ? newValue : 1); // Ensure minimum of 1
                  }}
                  onChange={(event: React.FormEvent<HTMLInputElement>) => {
                    const value = (event.target as HTMLInputElement).value;
                    const parsedValue = value === '' ? '' : Number(value);
                    if (parsedValue === '' || (Number.isInteger(parsedValue) && parsedValue > 0)) {
                      setSelectedEpochs(parsedValue);
                    }
                  }}
                  onPlus={() => {
                    const newValue = typeof selectedEpochs === 'number' ? selectedEpochs + 1 : 1;
                    setSelectedEpochs(newValue);
                  }}
                  inputName="epochs"
                  inputAriaLabel="Number of Epochs"
                  minusBtnAriaLabel="decrease number of epochs"
                  plusBtnAriaLabel="increase number of epochs"
                  min={1}
                />
              </FormGroup>
            </Form>
          </FlexItem>
        </Flex>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" isDisabled={!isValid} onClick={handleGenerateClick}>
          Generate
        </Button>
        <Button variant="secondary" isDisabled={!isValid} onClick={handleTrainClick}>
          Train
        </Button>
        <Button variant="secondary" isDisabled={!isValid} onClick={handlePipelineClick}>
          Generate &amp; Train
        </Button>
        <Button variant="link" onClick={() => onClose()}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AddFineTuningJobModal;
