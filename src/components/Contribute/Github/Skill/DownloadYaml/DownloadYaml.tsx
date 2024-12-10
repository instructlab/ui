import React from 'react';
import { SkillFormData } from '..';
import { SkillYamlData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import { DropdownItem } from '@patternfly/react-core/dist/esm/components/Dropdown/DropdownItem';
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';
import { SkillSchemaVersion } from '@/types/const';

interface Props {
  skillFormData: SkillFormData;
  githubUsername: string | undefined;
}

const DownloadYaml: React.FC<Props> = ({ skillFormData, githubUsername }) => {
  const handleDownloadYaml = () => {
    const yamlData: SkillYamlData = {
      created_by: githubUsername!,
      version: SkillSchemaVersion,
      task_description: skillFormData.documentOutline!,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.question,
        answer: example.answer
      }))
    };

    const yamlString = dumpYaml(yamlData);
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'skill.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return (
    <DropdownItem key="Download Yaml" to="#default-link6" onClick={handleDownloadYaml}>
      <CodeIcon /> Yaml File
    </DropdownItem>
  );
};

export default DownloadYaml;
