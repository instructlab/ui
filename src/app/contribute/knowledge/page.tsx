// src/app/contribute/knowledge/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import KnowledgeFormGithub from '@/components/Contribute/Knowledge/Github';
import KnowledgeFormNative from '@/components/Contribute/Knowledge/Native';

const KnowledgeFormPage: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | undefined>();

  useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDeploymentType(envConfig.DEPLOYMENT_TYPE);
    };
    getEnvVariables();
  }, []);

  return <AppLayout className="contribute-page">{deploymentType === 'native' ? <KnowledgeFormNative /> : <KnowledgeFormGithub />}</AppLayout>;
};

export default KnowledgeFormPage;
