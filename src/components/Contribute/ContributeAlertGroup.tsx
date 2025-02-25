// src/components/Contribute/Native/Knowledge/index.tsx
'use client';
import React from 'react';
import { AlertGroup, Alert, AlertActionCloseButton, Spinner } from '@patternfly/react-core';
import { ActionGroupAlertContent } from '@/components/Contribute/types';

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
        <p>
          {actionGroupAlertContent.waitAlert && <Spinner size="md" />}
          {actionGroupAlertContent.message}
          <br />
          {!actionGroupAlertContent.waitAlert &&
            actionGroupAlertContent.success &&
            actionGroupAlertContent.url &&
            actionGroupAlertContent.url.trim().length > 0 && (
              <a href={actionGroupAlertContent.url} rel="noreferrer">
                View your new branch
              </a>
            )}
        </p>
      </Alert>
    </AlertGroup>
  );
};

export default ContributeAlertGroup;
