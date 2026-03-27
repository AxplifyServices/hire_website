import { Test, TestingModule } from '@nestjs/testing';
import { AssurancesService } from './assurances.service';

describe('AssurancesService', () => {
  let service: AssurancesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AssurancesService],
    }).compile();

    service = module.get<AssurancesService>(AssurancesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
