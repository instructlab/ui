import React from 'react';
import yaml from 'js-yaml';
import { KnowledgeYamlData, SkillYamlData } from '@/types';
import { DropEvent, MultipleFileUpload, MultipleFileUploadMain } from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import { ActionGroupAlertContent } from './Knowledge/Github';

interface readFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

interface YamlFileUploadProps {
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isKnowledgeForm: boolean;
  onYamlUploadKnowledgeFillForm?: (data: KnowledgeYamlData) => void;
  onYamlUploadSkillsFillForm?: (data: SkillYamlData) => void;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
}

const YamlFileUpload: React.FC<YamlFileUploadProps> = ({
  setIsModalOpen,
  isKnowledgeForm,
  onYamlUploadKnowledgeFillForm,
  onYamlUploadSkillsFillForm,
  setActionGroupAlertContent
}) => {
  const [currentFiles, setCurrentFiles] = React.useState<File[]>([]);
  const [readFileData, setReadFileData] = React.useState<readFile[]>([]);
  // Implement a failiure condition in a future PR
  // const [fileUploadShouldFail, setFileUploadShouldFail] = React.useState(false);
  const fileUploadShouldFail = false;

  const handleFileInputChange = (file: File) => {
    if (file) {
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const fileContent = event.target?.result as string;

      try {
        const parsedData = yaml.load(fileContent);
        if (isKnowledgeForm && isKnowledgeFormData(parsedData)) {
          onYamlUploadKnowledgeFillForm?.(parsedData);
          setIsModalOpen(false);
        } else if (!isKnowledgeForm && isSkillFormData(parsedData)) {
          onYamlUploadSkillsFillForm?.(parsedData);
          setIsModalOpen(false);
        } else {
          const yamlFileSchemaIssueAlertContent: ActionGroupAlertContent = {
            title: 'YAML file upload error!',
            message: `This yaml file does not match the Skills or Knowledge schema.`,
            success: false,
            timeout: false
          };
          setActionGroupAlertContent(yamlFileSchemaIssueAlertContent);
          console.error('This yaml file does not match the Skills or Knowledge schema');
        }
      } catch (error) {
        const yamlFileParsingIssueAlertContent: ActionGroupAlertContent = {
          title: 'YAML file upload error!',
          message: `This yaml file is not correct and cannot be parsed.`,
          success: false,
          timeout: false
        };
        setActionGroupAlertContent(yamlFileParsingIssueAlertContent);
        console.error('Error parsing YAML file:', error);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file');
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

      setCurrentFiles((prevFiles) => [...prevFiles, ...corruptedFiles]);
    } else {
      setCurrentFiles((prevFiles) => [...prevFiles, ...files]);
      const latestFile = files.at(-1);
      if (latestFile) {
        handleFileInputChange(latestFile);
      } else {
        console.error('No latest file found!');
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

  // callback called by the status item when a file is successfully read with the built-in file reader
  // const handleReadSuccess = (data: string, file: File) => {
  //   setReadFileData((prevReadFiles) => [...prevReadFiles, { data, fileName: file.name, loadResult: 'success' }]);
  // };

  // // callback called by the status item when a file encounters an error while being read with the built-in file reader
  // const handleReadFail = (error: DOMException, file: File) => {
  //   setReadFileData((prevReadFiles) => [...prevReadFiles, { loadError: error, fileName: file.name, loadResult: 'danger' }]);
  // };

  // add helper text to a status item showing any error encountered during the file reading process
  // const createHelperText = (file: File) => {
  //   const fileResult = readFileData.find((readFile) => readFile.fileName === file.name);
  //   if (fileResult?.loadError) {
  //     return (
  //       <HelperText isLiveRegion>
  //         <HelperTextItem variant="error">{fileResult.loadError.toString()}</HelperTextItem>
  //       </HelperText>
  //     );
  //   }
  // };

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
      </MultipleFileUpload>
    </>
  );
};

export default YamlFileUpload;
