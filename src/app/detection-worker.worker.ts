/// <reference lib="webworker" />

import {
  env,
  ObjectDetectionPipeline,
  pipeline,
} from '@huggingface/transformers';

env.allowRemoteModels = true;
env.useFSCache = true;
env.localModelPath = 'models/';

let detector: ObjectDetectionPipeline | null = null;

addEventListener('message', async ({ data }) => {
  const { type, payload } = data;
  switch (type) {
    case 'loadModel':
      if (!detector) {
        try {
          detector = await pipeline(
            'object-detection',
            'Xenova/detr-resnet-50',
            { dtype: 'fp32' }
          );
          postMessage({ type: 'model loaded' });
        } catch (error: any) {
          postMessage({ type: 'model error', error: error.message });
        }
      } else {
        postMessage({ type: 'model already loaded' });
      }
      break;

    case 'detectObjects':
      if (!detector) {
        postMessage({
          type: 'detection error',
          error: 'Model not loaded in worker.',
        });
        return;
      }
      try {
        const outputs = await detector(payload, { threshold: 0.9 });
        postMessage({ type: 'detection result', detections: outputs });
      } catch (error: any) {
        postMessage({ type: 'detection error', error: error.message });
        console.error('Error during detection in worker:', error);
      }
      break;
  }
});
