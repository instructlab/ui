import { CustomModel, Endpoint, Model, ModelEndpointStatus, ServingModel } from '@/types';

const systemRole =
  'You are a cautious assistant. You carefully follow instructions.' +
  ' You are helpful and harmless and you follow ethical guidelines and promote positive behavior.';

const getCustomModelHeaders = (apiKey?: string): HeadersInit =>
  apiKey
    ? {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        Authorization: `Bearer: ${apiKey}`
      }
    : {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      };

const getCustomModelRequestData = (modelName: string, input: string): string => {
  const messagesPayload = [
    { role: 'system', content: systemRole },
    { role: 'user', content: input }
  ];

  const requestData = {
    model: modelName,
    messages: messagesPayload,
    stream: true
  };

  return JSON.stringify(requestData);
};

export const customModelFetcher = async (
  selectedModel: Model,
  input: string,
  onMessageReceived: (message: string) => void,
  setController?: (controller: AbortController) => void
) => {
  const newController = new AbortController();
  setController && setController(newController);

  // Client-side fetch if the selected model is a custom endpoint
  try {
    const response = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
      method: 'POST',
      headers: getCustomModelHeaders(selectedModel.apiKey),
      body: getCustomModelRequestData(selectedModel.modelName, input),
      signal: newController.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      try {
        const error = JSON.parse(errorText);
        onMessageReceived(`Error ${response.status}: ${error.message || errorText}`);
      } catch {
        onMessageReceived(`Error ${response.status}: ${errorText}`);
      }
      return;
    }

    if (!response.body) {
      onMessageReceived('No response body received from the server.');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let doneReading = false;
    let botMessage = '';

    try {
      while (!doneReading) {
        const { value, done: isDone } = await reader.read();
        doneReading = isDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const dataStr = line.substring('data: '.length).trim();
              if (dataStr === '[DONE]') {
                doneReading = true;
                break;
              }
              try {
                const parsed = JSON.parse(dataStr);
                const deltaContent = parsed.choices[0].delta?.content;
                if (deltaContent) {
                  botMessage += deltaContent;
                  onMessageReceived(botMessage);
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      const errorMsg = `Error fetching chat response: ${(error as Error).message}`;
      console.error(errorMsg);
      onMessageReceived(`${botMessage}
> ${errorMsg}`);
    }
  } catch (error) {
    const errorMsg = `Error fetching chat response:  ${(error as Error).message}`;
    console.error(errorMsg);
    onMessageReceived(`>${errorMsg}`);
  }
};

export const defaultModelFetcher = async (
  selectedModel: ServingModel,
  input: string,
  onMessageReceived: (message: string) => void,
  setController?: (controller: AbortController) => void
) => {
  // Default endpoints (server-side fetch)
  const newController = new AbortController();
  setController && setController(newController);

  const response = await fetch(
    `/api/playground/chat?apiURL=${encodeURIComponent(selectedModel.apiURL)}&modelName=${encodeURIComponent(selectedModel.vvlmName)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: input, systemRole }),
      signal: newController.signal
    }
  );

  if (response.body) {
    const reader = response.body.getReader();
    const textDecoder = new TextDecoder('utf-8');
    let botMessage = '';

    await (async () => {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = textDecoder.decode(value, { stream: true });
        botMessage += chunk;

        onMessageReceived(botMessage);
      }
    })();
  } else {
    onMessageReceived('Failed to fetch response from the server.');
  }
};

export const modelFetcher = async (
  selectedModel: Model,
  input: string,
  onMessageReceived: (message: string) => void,
  setController?: (controller: AbortController) => void
) =>
  selectedModel.isDefault
    ? defaultModelFetcher(selectedModel as ServingModel, input, onMessageReceived, setController)
    : customModelFetcher(selectedModel, input, onMessageReceived, setController);

export const fetchEndpointStatus = async (endpoint: Endpoint): Promise<ModelEndpointStatus> => {
  if (!endpoint.enabled) {
    return ModelEndpointStatus.disabled;
  }
  // Attempt a fetch for the custom endpoint
  try {
    const response = await fetch(`${endpoint.url}/v1/chat/completions`, {
      method: 'POST',
      headers: getCustomModelHeaders(endpoint.apiKey),
      body: getCustomModelRequestData(endpoint.modelName, 'test')
    });

    if (!response.ok) {
      console.error(`Failed to serve model from endpoint ${endpoint.url}`);
      return ModelEndpointStatus.unavailable;
    }
    return ModelEndpointStatus.available;
  } catch (error) {
    return ModelEndpointStatus.unknown;
  }
};

export const isServingModel = (model: Model) => !!(model as ServingModel).endpoint;

const fetchServingModelStatus = async (servedModel: ServingModel): Promise<string> => {
  try {
    const res = await fetch(`/api/fine-tune/model/vllm-status?modelName=${servedModel.vvlmName}`);
    if (!res.ok) {
      console.error('Failed to fetch vllm status', res.status, res.statusText);
      return 'stopped';
    }

    const data = await res.json();
    return data.status;
  } catch (error) {
    console.error('Error fetching vllm status:', error);
    return 'stopped';
  }
};

const fetchCustomModelStatus = async (customModel: CustomModel): Promise<string> => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  if (customModel.apiKey) {
    headers['Authorization'] = `Bearer ${customModel.apiKey}`;
  }

  try {
    const response = await fetch(`${customModel.apiURL}/v1/models?id=${customModel.modelName}`, {
      headers
    });

    if (!response.ok) {
      console.error(`Failed to serve model from endpoint ${customModel.apiURL}`);
      return 'stopped';
    }
    return 'running';
  } catch (error) {
    return 'stopped';
  }
};

export const fetchModelStatus = async (model: Model): Promise<string> =>
  isServingModel(model) ? fetchServingModelStatus(model as ServingModel) : fetchCustomModelStatus(model as CustomModel);

export const fetchModelJobId = async (servingModel: ServingModel): Promise<{ jobId?: string; error?: string }> => {
  try {
    const response = await fetch(servingModel.endpoint, {
      method: 'POST'
    });

    if (!response.ok) {
      console.error(`Failed to serve model from endpoint ${servingModel.endpoint}`);
      return { error: `Failed to serve model from endpoint ${servingModel.endpoint}` };
    }

    const data = await response.json();
    const { job_id } = data;
    if (!job_id) {
      console.error('No job_id returned from serving model');
      return { error: 'Invalid response returned from serving model' };
    }

    return { jobId: job_id };
  } catch (error) {
    console.error('Error serving model:', error);
    return { error: `Error serving model: ${error}` };
  }
};
