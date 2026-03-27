import { Test, TestingModule } from '@nestjs/testing';
import { AssurancesController } from './assurances.controller';

describe('AssurancesController', () => {
  let controller: AssurancesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssurancesController],
    }).compile();

    controller = module.get<AssurancesController>(AssurancesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
