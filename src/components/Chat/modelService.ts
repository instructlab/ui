import { Model } from '@/types';

const systemRole =
  'You are a cautious assistant. You carefully follow instructions.' +
  ' You are helpful and harmless and you follow ethical guidelines and promote positive behavior.';

export const customModelFetcher = async (
  selectedModel: Model,
  input: string,
  onMessageReceived: (message: string) => void,
  setController: (controller: AbortController) => void
) => {
  const messagesPayload = [
    { role: 'system', content: systemRole },
    { role: 'user', content: input }
  ];

  const requestData = {
    model: selectedModel.modelName,
    messages: messagesPayload,
    stream: true
  };

  const newController = new AbortController();
  setController(newController);

  // Client-side fetch if the selected model is a custom endpoint
  try {
    const response = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream'
      },
      body: JSON.stringify(requestData),
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
  selectedModel: Model,
  input: string,
  onMessageReceived: (message: string) => void,
  setController: (controller: AbortController) => void
) => {
  // Default endpoints (server-side fetch)
  const newController = new AbortController();
  setController(newController);

  const response = await fetch(
    `/api/playground/chat?apiURL=${encodeURIComponent(selectedModel.apiURL)}&modelName=${encodeURIComponent(selectedModel.modelName)}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ input, systemRole }),
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
  setController: (controller: AbortController) => void
) =>
  selectedModel.isDefault
    ? defaultModelFetcher(selectedModel, input, onMessageReceived, setController)
    : customModelFetcher(selectedModel, input, onMessageReceived, setController);
