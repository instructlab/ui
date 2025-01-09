import React from 'react';
import { SkillFormData, SkillYamlData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import { SkillSchemaVersion } from '@/types/const';
import { DropdownItem } from '@patternfly/react-core';
import { CodeIcon } from '@patternfly/react-icons';

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
