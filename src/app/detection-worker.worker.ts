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
          postMessage({ type: 'modelLoaded' });
        } catch (error: any) {
          postMessage({ type: 'modelError', error: error.message });
        }
      } else {
        postMessage({ type: 'modelAlreadyLoaded' });
      }
      break;

    case 'detectObjects':
      if (!detector) {
        postMessage({
          type: 'detectionError',
          error: 'Model not loaded in worker.',
        });
        console.error('Model not loaded in worker.');
        return;
      }
      try {
        const outputs = await detector(payload, { threshold: 0.9 });
        postMessage({ type: 'detectionResult', detections: outputs });
      } catch (error: any) {
        postMessage({ type: 'detectionError', error: error.message });
        console.error('Error during detection in worker:', error);
      }
      break;
  }
});
