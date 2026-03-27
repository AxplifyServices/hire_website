import { Test, TestingModule } from '@nestjs/testing';
import { TarificationsController } from './tarifications.controller';

describe('TarificationsController', () => {
  let controller: TarificationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TarificationsController],
    }).compile();

    controller = module.get<TarificationsController>(TarificationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
