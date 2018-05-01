import { TestBed, inject } from '@angular/core/testing';

import { StrategiesService } from './strategies.service';

describe('StrategiesService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [StrategiesService]
    });
  });

  it('should be created', inject([StrategiesService], (service: StrategiesService) => {
    expect(service).toBeTruthy();
  }));
});
