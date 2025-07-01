import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetectionWorkerService {
  private worker: Worker | undefined;
  private workerSubscriber$ = new Subject();

  constructor() {
    this.workerInit();
    if (this.worker) {
      this.sendMessage('loadModel');
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

  sendMessage(type: 'loadModel' | 'detectObjects', payload?: File) {
    this.worker?.postMessage({type, payload});
  }
}
