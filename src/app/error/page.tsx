// src/app/error/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './error.module.css';

const ErrorPageContent = () => {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  let errorMessage = 'Something went wrong.';
  if (error === 'AccessDenied') {
    errorMessage = 'Whoops! You need to be a member of the InstructLab org to access this site. Try joining and then come back!';
  }

  return (
    <div className={styles.errorContainer}>
      <h1 className={styles.errorTitle}>404</h1>
      <p className={styles.errorMessage}>{errorMessage}</p>
      <a className={styles.backLink} href="/">
        Return to the Login Page
      </a>
      <p className={styles.orgLink}>
        Want to join the InstructLab organization? Visit our
        <a className={styles.inlineLink} href="https://github.com/instructlab" target="_blank" rel="noopener noreferrer">
          {' '}
          GitHub page
        </a>
        .
      </p>
    </div>
  );
};

const ErrorPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <ErrorPageContent />
  </Suspense>
);

export default ErrorPage;
