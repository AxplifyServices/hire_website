import { Test, TestingModule } from '@nestjs/testing';
import { PolitiquesAgeService } from './politiques-age.service';

describe('PolitiquesAgeService', () => {
  let service: PolitiquesAgeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PolitiquesAgeService],
    }).compile();

    service = module.get<PolitiquesAgeService>(PolitiquesAgeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
