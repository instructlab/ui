import React from 'react';
import { FileUpload } from '@patternfly/react-core/dist/dynamic/components/FileUpload';
import { Form, FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import yaml from 'js-yaml';
import { KnowledgeYamlData, SkillYamlData } from '@/types';

interface YamlFileUploadProps {
  isKnowledgeForm: boolean;
  onYamlUploadKnowledgeFillForm?: (data: KnowledgeYamlData) => void;
  onYamlUploadSkillsFillForm?: (data: SkillYamlData) => void;
}

const YamlFileUpload: React.FC<YamlFileUploadProps> = ({ isKnowledgeForm, onYamlUploadKnowledgeFillForm, onYamlUploadSkillsFillForm }) => {
  const [value, setValue] = React.useState('');
  const [filename, setFilename] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRejected, setIsRejected] = React.useState(false);

  const handleFileInputChange = (_: unknown, file: File) => {
    setFilename(file.name);
    if (file) {
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    setIsLoading(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileContent = event.target?.result as string;
      setValue(fileContent);
      setIsLoading(false);

      try {
        const parsedData = yaml.load(fileContent);
        if (isKnowledgeForm && isKnowledgeFormData(parsedData)) {
          onYamlUploadKnowledgeFillForm?.(parsedData);
        } else if (!isKnowledgeForm && isSkillFormData(parsedData)) {
          onYamlUploadSkillsFillForm?.(parsedData);
        } else {
          setIsRejected(true);
        }
      } catch (error) {
        console.error('Error parsing YAML file:', error);
        setIsRejected(true);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
      setIsLoading(false);
      setIsRejected(true);
    };

    reader.readAsText(file);
  };

  // Type guard for KnowledgeFormData
  const isKnowledgeFormData = (data: unknown): data is KnowledgeYamlData => {
    if (!data) return false;
    return data && typeof data === 'object' && 'document' in data && 'document_outline' in data;
  };

  // Type guard for SkillFormData
  const isSkillFormData = (data: unknown): data is SkillYamlData => {
    if (!data) return false;
    return data && typeof data === 'object' && 'task_description' in data;
  };

  const handleClear = () => {
    setFilename('');
    setValue('');
    setIsRejected(false);
  };

  return (
    <FormFieldGroupExpandable
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: <p>Load a pre-exsiting yaml file</p>,
            id: 'author-info-id'
          }}
          titleDescription="If you have partially completed yaml file you can upload it!"
        />
      }
    >
      <FormGroup fieldId="text-file-with-restrictions-example">
        <FileUpload
          id="text-file-with-restrictions-example"
          value={value}
          filename={filename}
          filenamePlaceholder="Drag and drop an existing YAML file"
          onFileInputChange={handleFileInputChange}
          onClearClick={handleClear}
          isLoading={isLoading}
          dropzoneProps={{
            accept: { 'application/x-yaml': ['.yaml', '.yml'], 'text/yaml': ['.yaml', '.yml'] },
            maxSize: 10000,
            onDropRejected: () => setIsRejected(true)
          }}
          validated={isRejected ? 'error' : 'default'}
          browseButtonText="Upload"
        />
        <FormHelperText>
          <HelperText>
            <HelperTextItem variant={isRejected ? 'error' : 'default'}>
              {isRejected ? 'Invalid YAML file for this form type' : 'Upload a YAML file'}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default YamlFileUpload;
