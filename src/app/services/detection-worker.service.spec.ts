import { TestBed } from '@angular/core/testing';

import { DetectionWorkerService } from './detection-worker.service';

describe('DetectionWorkerService', () => {
  let service: DetectionWorkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DetectionWorkerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
