// src/app/contribute/knowledge/page.tsx
'use client';
import React from 'react';
import { Flex, Spinner } from '@patternfly/react-core';
import { t_global_spacer_xl as XlSpacerSize } from '@patternfly/react-tokens';
import { AppLayout } from '@/components/AppLayout';
import { useEnvConfig } from '@/context/EnvConfigContext';
import KnowledgeWizard from '@/components/Contribute/Knowledge/KnowledgeWizard/KnowledgeWizard';

const KnowledgeFormPage: React.FunctionComponent = () => {
  const {
    loaded,
    envConfig: { isGithubMode }
  } = useEnvConfig();

  return (
    <AppLayout className="contribute-page">
      {loaded ? (
        <KnowledgeWizard isGithubMode={isGithubMode} />
      ) : (
        <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} style={{ padding: XlSpacerSize.var }}>
          <Spinner size="xl" />
        </Flex>
      )}
    </AppLayout>
  );
};

export default KnowledgeFormPage;
