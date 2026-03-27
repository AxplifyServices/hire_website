import { Test, TestingModule } from '@nestjs/testing';
import { AbandonedCartsService } from './abandoned-carts.service';

describe('AbandonedCartsService', () => {
  let service: AbandonedCartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AbandonedCartsService],
    }).compile();

    service = module.get<AbandonedCartsService>(AbandonedCartsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
