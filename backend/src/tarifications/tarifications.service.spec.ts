import { Test, TestingModule } from '@nestjs/testing';
import { TarificationsService } from './tarifications.service';

describe('TarificationsService', () => {
  let service: TarificationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TarificationsService],
    }).compile();

    service = module.get<TarificationsService>(TarificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
