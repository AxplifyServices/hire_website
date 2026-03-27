import { Test, TestingModule } from '@nestjs/testing';
import { PolitiquesAgeController } from './politiques-age.controller';

describe('PolitiquesAgeController', () => {
  let controller: PolitiquesAgeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PolitiquesAgeController],
    }).compile();

    controller = module.get<PolitiquesAgeController>(PolitiquesAgeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
