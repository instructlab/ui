// src/components/AppLayout.tsx
'use client';

import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Banner, Flex, FlexItem, Button } from '@patternfly/react-core';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

const FEATURE_FLAG_PARAM = 'devFeatureFlags';

const DevFlagsBanner: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { devFeatureFlagsEnabled, setDevFeatureFlagsEnabled } = useFeatureFlags();

  React.useEffect(() => {
    const featureFlagParam = searchParams.get(FEATURE_FLAG_PARAM);
    if (featureFlagParam !== null) {
      setDevFeatureFlagsEnabled(true);
    }
  }, [searchParams, setDevFeatureFlagsEnabled]);

  const disableFeatureFlags = () => {
    setDevFeatureFlagsEnabled(false);

    const params = new URLSearchParams(searchParams.toString());
    params.delete(FEATURE_FLAG_PARAM);
    router.push(pathname + '?' + params.toString());
  };

  if (!devFeatureFlagsEnabled) {
    return null;
  }
  return (
    <Banner color="blue">
      <Flex justifyContent={{ default: 'justifyContentSpaceAround' }}>
        <FlexItem>
          Feature flags are overridden in the current session.{' '}
          <Button variant="link" isInline onClick={disableFeatureFlags}>
            Click here
          </Button>{' '}
          to reset back to defaults.
        </FlexItem>
      </Flex>
    </Banner>
  );
};

export default DevFlagsBanner;
