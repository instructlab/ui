export interface Model {
  name: string;
  last_modified: string;
  size: string;
}

export interface Branch {
  name: string;
  creationDate: number;
}

export interface Job {
  job_id: string;
  status: string;
  type?: 'generate' | 'train' | 'pipeline' | 'model-serve' | 'vllm-run';
  branch?: string;
  start_time: string; // ISO timestamp
  end_time?: string;
}
