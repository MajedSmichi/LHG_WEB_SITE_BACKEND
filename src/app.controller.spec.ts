import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
    controller = new AppController(service);
  });

  it('should return "Hello World!"', () => {
    expect(controller.getHello()).toBe('Hello World!');
  });
});
