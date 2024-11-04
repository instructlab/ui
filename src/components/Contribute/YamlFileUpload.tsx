import React from 'react';
import { FileUpload } from '@patternfly/react-core/dist/dynamic/components/FileUpload';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import yaml from 'js-yaml';
import { KnowledgeFormData } from './Knowledge';
import { SkillFormData } from './Skill';

interface YamlFileUploadProps {
  isKnowledgeForm: boolean;
  onYamlUploadFillForm: (data: KnowledgeFormData | SkillFormData) => void;
}

const YamlFileUpload: React.FC<YamlFileUploadProps> = ({ isKnowledgeForm, onYamlUploadFillForm }) => {
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
          onYamlUploadFillForm(parsedData);
        } else if (!isKnowledgeForm) {
          const skillData = parsedData as SkillFormData;
          onYamlUploadFillForm(skillData);
        } else {
          setIsRejected(true); // Set rejected if it doesn't match expected type
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

  const isKnowledgeFormData = (data: object): data is KnowledgeFormData => {
    return typeof data === 'object' && 'knowledgeDocumentRepositoryUrl' in data && 'knowledgeDocumentCommit' in data;
  };

  const handleClear = () => {
    setFilename('');
    setValue('');
    setIsRejected(false);
  };

  return (
    <>
      <Form>
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
      </Form>
    </>
  );
};

export default YamlFileUpload;
