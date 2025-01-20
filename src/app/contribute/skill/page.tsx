// src/app/contribute/skill/page.tsx
'use client';
import { AppLayout } from '@/components/AppLayout';
import { SkillFormGithub } from '@/components/Contribute/Skill/Github/index';
import { SkillFormNative } from '@/components/Contribute/Skill/Native/index';
import { useEffect, useState } from 'react';

const SkillFormPage: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | undefined>();

  useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDeploymentType(envConfig.DEPLOYMENT_TYPE);
    };
    getEnvVariables();
  }, []);

  return <AppLayout>{deploymentType === 'native' ? <SkillFormNative /> : <SkillFormGithub />}</AppLayout>;
};

export default SkillFormPage;
