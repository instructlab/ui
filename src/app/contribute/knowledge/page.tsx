// src/app/contribute/knowledge/page.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { Flex, Spinner } from '@patternfly/react-core';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens';
import { AppLayout } from '@/components/AppLayout';
import KnowledgeFormGithub from '@/components/Contribute/Knowledge/Github';
import KnowledgeFormNative from '@/components/Contribute/Knowledge/Native';

import '../contribute-page.scss';

const KnowledgeFormPage: React.FunctionComponent = () => {
  const [deploymentType, setDeploymentType] = useState<string | undefined>();
  const [loaded, setLoaded] = useState<boolean>();

  useEffect(() => {
    let canceled = false;

    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      if (!canceled) {
        setDeploymentType(envConfig.DEPLOYMENT_TYPE);
        setLoaded(true);
      }
    };

    getEnvVariables();

    return () => {
      canceled = true;
    };
  }, []);

  return (
    <AppLayout className="contribute-page">
      {loaded ? (
        <>{deploymentType === 'native' ? <KnowledgeFormNative /> : <KnowledgeFormGithub />}</>
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default KnowledgeFormPage;
