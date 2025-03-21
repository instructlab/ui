export const GRANITE_BASE_MODEL_NAME = 'granite-base';
export const GRANITE_BASE_MODEL_DISPLAY_NAME = 'Granite base model (Serving)';
export const GRANITE_BASE_MODEL_END_POINT = '/api/fine-tune/model/serve-base';
export const GRANITE_BASE_MODEL_PORT = 8000;

export const GRANITE_LATEST_MODEL_NAME = 'granite-latest';
export const GRANITE_LATEST_MODEL_DISPLAY_NAME = 'Granite fine tune checkpoint (Serving)';
export const GRANITE_LATEST_MODEL_END_POINT = '/api/fine-tune/model/serve-latest';
export const GRANITE_LATEST_MODEL_PORT = 8001;

export const GRANITE_BASE_MODEL = {
  name: GRANITE_BASE_MODEL_DISPLAY_NAME,
  modelName: GRANITE_BASE_MODEL_NAME,
  endpoint: GRANITE_BASE_MODEL_END_POINT,
  port: GRANITE_BASE_MODEL_PORT
};

export const GRANITE_LATEST_MODEL = {
  name: GRANITE_LATEST_MODEL_DISPLAY_NAME,
  modelName: GRANITE_LATEST_MODEL_NAME,
  endpoint: GRANITE_LATEST_MODEL_END_POINT,
  port: GRANITE_LATEST_MODEL_PORT
};
