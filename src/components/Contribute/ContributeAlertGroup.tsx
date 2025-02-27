// src/components/Contribute/Native/Knowledge/index.tsx
'use client';
import React from 'react';
import { AlertGroup, Alert, AlertActionCloseButton, Spinner, Button, Flex, FlexItem } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

export interface ContributeAlertGroupProps {
  actionGroupAlertContent?: ActionGroupAlertContent;
  onCloseActionGroupAlert: () => void;
}

export const ContributeAlertGroup: React.FunctionComponent<ContributeAlertGroupProps> = ({ actionGroupAlertContent, onCloseActionGroupAlert }) => {
  if (!actionGroupAlertContent) {
    return null;
  }

  return (
    <AlertGroup isToast isLiveRegion>
      <Alert
        variant={actionGroupAlertContent.waitAlert ? 'info' : actionGroupAlertContent.success ? 'success' : 'danger'}
        title={actionGroupAlertContent.title}
        timeout={actionGroupAlertContent.timeout === false ? false : actionGroupAlertContent.timeout}
        onTimeout={onCloseActionGroupAlert}
        actionClose={<AlertActionCloseButton onClose={onCloseActionGroupAlert} />}
      >
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }} flexWrap={{ default: 'nowrap' }}>
              {actionGroupAlertContent.waitAlert ? (
                <FlexItem>
                  <Spinner size="md" />
                </FlexItem>
              ) : null}
              <FlexItem>{actionGroupAlertContent.message}</FlexItem>
            </Flex>
          </FlexItem>
          {!actionGroupAlertContent.waitAlert &&
          actionGroupAlertContent.success &&
          actionGroupAlertContent.url &&
          actionGroupAlertContent.url.trim().length > 0 ? (
            <FlexItem>
              <Button
                component="a"
                isInline
                variant="link"
                href={actionGroupAlertContent.url}
                rel={actionGroupAlertContent.isUrlExternal ? 'noopener noreferrer' : 'noreferrer'}
                target={actionGroupAlertContent.isUrlExternal ? '_blank' : undefined}
                icon={actionGroupAlertContent.isUrlExternal ? <ExternalLinkAltIcon /> : undefined}
                iconPosition="end"
              >
                View your new branch
              </Button>
            </FlexItem>
          ) : null}
        </Flex>
      </Alert>
    </AlertGroup>
  );
};

export default ContributeAlertGroup;
