// src/lib/api/index.ts
const taskPollWaitSeconds = 10;

interface ApiResult<R> {
  status: number;
  error?: string;
  payload?: R;
}

interface Task {
  task_id: string;
  task_status: 'SUCCESS' | 'FAILURE' | string;
  result: { transaction_id: string };
}

interface DocumentArtifactsPageImage {
  page_no: number;
  url: string;
}

interface DocumentArtifacts {
  document_pdf: string;
  document_md: string;
  document_json: string;
  page_images: DocumentArtifactsPageImage[];
}

export default class Client {
  private host: string;
  private token: string;

  constructor(host: string) {
    this.host = host;
    this.token = '';
  }

  async authenticate(userName: string, apiKey: string): Promise<ApiResult<string>> {
    const url = `${this.host}/api/cps/user/v1/user/token`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + btoa(`${userName}:${apiKey}`),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    const result = await this.payloadOrError<{ access_token: string }>(response);

    const tokenResult = this.mapResult(result, (r) => r['access_token']);

    if (tokenResult.payload) {
      this.token = tokenResult.payload ?? '';
    }

    return tokenResult;
  }

  async launchConvert(projKey: string, indexKey: string, sourceURL: string): Promise<ApiResult<Task>> {
    return await this.post<{ file_url: string[] }, Task>({
      path: `api/cps/public/v1/project/${projKey}/data_indices/${indexKey}/actions/ccs_convert_upload`,
      payload: { file_url: [sourceURL] }
    });
  }

  async waitForTask(projKey: string, taskId: string): Promise<ApiResult<Task>> {
    while (true) {
      const response = await this.get<Task>({
        path: `api/cps/public/v2/project/${projKey}/celery_tasks/${taskId}?wait=${taskPollWaitSeconds}`
      });

      if (response.payload) {
        console.debug('Task status: ', response.payload.task_status);

        if (['SUCCESS', 'FAILURE'].includes(response.payload.task_status)) {
          return response;
        }
      } else {
        console.debug('Failed to retrieve task status: ', response.status, response.error);
      }
    }
  }

  async getDocumentHashes(projKey: string, indexKey: string, transactionId: string): Promise<ApiResult<string[]>> {
    const response = await this.get<{ documents: { document_hash: string }[] }>({
      path: `api/cps/public/v2/project/${projKey}/data_indices/${indexKey}/documents/transactions/${transactionId}`
    });

    return this.mapResult(response, (r) => r.documents.map((d: any) => d.document_hash));
  }

  async getDocumentArtifacts(projKey: string, indexKey: string, documentHash: string): Promise<ApiResult<DocumentArtifacts>> {
    const response = await this.get<{ artifacts: DocumentArtifacts }>({
      path: `api/cps/public/v2/project/${projKey}/data_indices/${indexKey}/documents/${documentHash}/artifacts`
    });

    return this.mapResult(response, (r) => r.artifacts);
  }

  private async post<P, R>({ path, payload }: { path: string; payload: P }): Promise<ApiResult<R>> {
    try {
      const response = await fetch(`${this.host}/${path}`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: {
          Authorization: this.token,
          'Content-Type': 'application/json'
        }
      });

      return this.payloadOrError<R>(response);
    } catch (ex) {
      console.error(ex);
      throw ex;
    }
  }

  private async get<R>({ path }: { path: string }): Promise<ApiResult<R>> {
    const response = await fetch(`${this.host}/${path}`, {
      method: 'GET',
      headers: {
        Authorization: this.token
      }
    });

    return this.payloadOrError<R>(response);
  }

  /**
   * Convert an API response into a usable payload or an error message.
   */
  private async payloadOrError<R>(response: Response): Promise<ApiResult<R>> {
    if (response.ok) {
      return { status: response.status, payload: (await response.json()) as R };
    } else {
      return { status: response.status, error: response.statusText };
    }
  }

  /**
   * Map API results payload into something else.
   */
  private mapResult<I, O>(result: ApiResult<I>, f: (input: I) => O): ApiResult<O> {
    return result.payload ? { ...result, payload: f(result.payload) } : ({ ...result } as ApiResult<O>);
  }
}
