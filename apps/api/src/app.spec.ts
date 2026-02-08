import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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

    it('debe incluir un timestamp', () => {
      const resultado = appController.obtenerInfo();
      expect(resultado.timestamp).toBeDefined();
    });
  });
});

describe('AppService', () => {
  let appService: AppService;

  beforeEach(() => {
    appService = new AppService();
  });

  it('debe estar definido', () => {
    expect(appService).toBeDefined();
  });

  it('debe retornar información de la API', () => {
    const info = appService.obtenerInfo();
    expect(info.nombre).toBe('EmepetrePlayer API');
    expect(info.version).toBe('1.0.0');
    expect(info.descripcion).toBeDefined();
    expect(info.estado).toBe('activo');
  });
});
