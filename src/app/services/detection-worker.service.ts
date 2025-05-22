import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetectionWorkerService {
  worker: Worker | undefined;
  callbacks: Array<(response: any) => void> = [];

  workerSubscriber$ = new Subject();

  constructor() {
    this.workerInit();
    if (this.worker) {
      this.worker.postMessage({ type: 'loadModel' });
    }
  }

  setWorkerSubscriber$(data: any) {
    this.workerSubscriber$.next(data);
  }

  getWorkerSubscriber$() {
    return this.workerSubscriber$.asObservable();
  }

  workerInit() {
    this.worker = new Worker(new URL('../detection-worker.worker', import.meta.url));
    this.worker.onmessage = (res) => {
      this.setWorkerSubscriber$(res);
    };
  }

  sendMessage(type: 'loadModel' | 'detectObjects', file: File) {
    this.worker?.postMessage({type, payload: file});
  }
}
