// src/app/contribute/knowledge/page.tsx
'use client';
import React from 'react';
import { Flex, Spinner } from '@patternfly/react-core';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens';
import { AppLayout } from '@/components/AppLayout';
import KnowledgeFormGithub from '@/components/Contribute/Knowledge/Github';
import KnowledgeFormNative from '@/components/Contribute/Knowledge/Native';
import { useEnvConfig } from '@/context/EnvConfigContext';

const KnowledgeFormPage: React.FunctionComponent = () => {
  const {
    loaded,
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <AppLayout className="contribute-page">
      {loaded ? (
        <>{!isGithubMode ? <KnowledgeFormNative /> : <KnowledgeFormGithub />}</>
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default KnowledgeFormPage;
