import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  let service: LoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [LoadingService] });
    service = TestBed.inject(LoadingService);
  });

  it('inicia com isLoading$ = false (nenhuma requisição ativa)', async () => {
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(false);
  });

  it('isLoading$ = true após increment()', async () => {
    service.increment();
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(true);
  });

  it('isLoading$ = false após increment() + decrement()', async () => {
    service.increment();
    service.decrement();
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(false);
  });

  it('isLoading$ = true quando há múltiplas requisições ativas', async () => {
    service.increment();
    service.increment();
    service.decrement();
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(true);
  });

  it('decrement() não desce abaixo de zero (não emite negativo)', async () => {
    service.decrement();
    service.decrement();
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(false);
  });

  it('isLoading$ = false após igualar decrements aos increments', async () => {
    service.increment();
    service.increment();
    service.increment();
    service.decrement();
    service.decrement();
    service.decrement();
    const loading = await firstValueFrom(service.isLoading$);
    expect(loading).toBe(false);
  });
});
