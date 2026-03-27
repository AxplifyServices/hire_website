import { Test, TestingModule } from '@nestjs/testing';
import { AgencesController } from './agences.controller';

describe('AgencesController', () => {
  let controller: AgencesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AgencesController],
    }).compile();

    controller = module.get<AgencesController>(AgencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
