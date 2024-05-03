export interface JobModel {
  jobID: string;
  status: string;
  duration: string;
  repoOwner: string;
  author: string;
  prNumber: string;
  prSHA: string;
  requestTime: string;
  errors: string;
  repoName: string;
  jobType: string;
  installationID: string;
  s3URL: string;
  modelName: string;
  cmd: string;
}
