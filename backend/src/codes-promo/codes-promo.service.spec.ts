import { Test, TestingModule } from '@nestjs/testing';
import { CodesPromoService } from './codes-promo.service';

describe('CodesPromoService', () => {
  let service: CodesPromoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CodesPromoService],
    }).compile();

    service = module.get<CodesPromoService>(CodesPromoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
