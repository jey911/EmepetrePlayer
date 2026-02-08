import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('obtenerInfo', () => {
    it('debe retornar la información de la API', () => {
      const resultado = appController.obtenerInfo();
      expect(resultado).toBeDefined();
      expect(resultado.nombre).toBe('EmepetrePlayer API');
      expect(resultado.version).toBe('1.0.0');
      expect(resultado.estado).toBe('activo');
    });
  });
});
