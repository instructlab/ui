import React from 'react';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import yaml from 'js-yaml';
import { KnowledgeYamlData, SkillYamlData } from '@/types';
import { MultipleFileUpload } from '@patternfly/react-core/dist/esm/components/MultipleFileUpload/MultipleFileUpload';
import { MultipleFileUploadMain } from '@patternfly/react-core/dist/esm/components/MultipleFileUpload/MultipleFileUploadMain';
import { MultipleFileUploadStatus } from '@patternfly/react-core/dist/esm/components/MultipleFileUpload/MultipleFileUploadStatus';
import { MultipleFileUploadStatusItem } from '@patternfly/react-core/dist/esm/components/MultipleFileUpload/MultipleFileUploadStatusItem';
import { DropEvent } from '@patternfly/react-core/dist/esm/helpers/typeUtils';
import { UploadIcon } from '@patternfly/react-icons/dist/esm/icons/upload-icon';

interface readFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

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

  const [currentFiles, setCurrentFiles] = React.useState<File[]>([]);
  const [showStatus, setShowStatus] = React.useState(false);
  const [statusIcon, setStatusIcon] = React.useState('inProgress');
  const [readFileData, setReadFileData] = React.useState<readFile[]>([]);
  const [fileUploadShouldFail, setFileUploadShouldFail] = React.useState(false);

  const handleFileInputChange = (file: File) => {
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

  // remove files from both state arrays based on their name
  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = currentFiles.filter((currentFile) => !namesOfFilesToRemove.some((fileName) => fileName === currentFile.name));

    setCurrentFiles(newCurrentFiles);

    const newReadFiles = readFileData.filter((readFile) => !namesOfFilesToRemove.some((fileName) => fileName === readFile.fileName));

    setReadFileData(newReadFiles);
  };

  /** Forces uploaded files to become corrupted if "Demonstrate error reporting by forcing uploads to fail" is selected in the example,
   * only used in this example for demonstration purposes */
  const updateCurrentFiles = (files: File[]) => {
    if (fileUploadShouldFail) {
      const corruptedFiles = files.map((file) => ({ ...file, lastModified: 'foo' as unknown as number }));

      setCurrentFiles((prevFiles) => [...prevFiles, ...(corruptedFiles as any)]);
    } else {
      setCurrentFiles((prevFiles) => [...prevFiles, ...files]);
      const latestFile = files.at(-1);
      if (latestFile) {
        handleFileInputChange(latestFile);
      } else {
        console.log('No latest file found!');
      }
    }
  };

  // callback that will be called by the react dropzone with the newly dropped file objects
  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    // identify what, if any, files are re-uploads of already uploaded files
    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((droppedFile) => currentFileNames.includes(droppedFile.name));

    /** this promise chain is needed because if the file removal is done at the same time as the file adding react
     * won't realize that the status items for the re-uploaded files needs to be re-rendered */
    Promise.resolve()
      .then(() => removeFiles(reUploads.map((file) => file.name)))
      .then(() => updateCurrentFiles(droppedFiles));
  };

  const successfullyReadFileCount = readFileData.filter((fileData) => fileData.loadResult === 'success').length;

  // callback called by the status item when a file is successfully read with the built-in file reader
  const handleReadSuccess = (data: string, file: File) => {
    setReadFileData((prevReadFiles) => [...prevReadFiles, { data, fileName: file.name, loadResult: 'success' }]);
  };

  // callback called by the status item when a file encounters an error while being read with the built-in file reader
  const handleReadFail = (error: DOMException, file: File) => {
    setReadFileData((prevReadFiles) => [...prevReadFiles, { loadError: error, fileName: file.name, loadResult: 'danger' }]);
  };

  // add helper text to a status item showing any error encountered during the file reading process
  const createHelperText = (file: File) => {
    const fileResult = readFileData.find((readFile) => readFile.fileName === file.name);
    if (fileResult?.loadError) {
      return (
        <HelperText isLiveRegion>
          <HelperTextItem variant="error">{fileResult.loadError.toString()}</HelperTextItem>
        </HelperText>
      );
    }
  };

  return (
    <>
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: {
            'application/x-yaml': ['.yaml', '.yml'],
            'text/yaml': ['.yaml', '.yml']
          }
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: YAML"
        />
        {showStatus && (
          <MultipleFileUploadStatus
            statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files uploaded`}
            statusToggleIcon={statusIcon}
            aria-label="Current uploads"
          >
            {currentFiles.map((file) => (
              <MultipleFileUploadStatusItem
                file={file}
                key={file.name}
                onClearClick={() => removeFiles([file.name])}
                onReadSuccess={handleReadSuccess}
                onReadFail={handleReadFail}
                progressHelperText={createHelperText(file)}
              />
            ))}
          </MultipleFileUploadStatus>
        )}
      </MultipleFileUpload>
    </>
  );
};

export default YamlFileUpload;
