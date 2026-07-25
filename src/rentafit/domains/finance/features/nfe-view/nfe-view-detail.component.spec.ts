import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { NfeViewDetailComponent } from './nfe-view-detail.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import {
  IEmailInvoiceRequest,
  IFiscalDocument,
} from '../../data/fiscal-document.types';

interface NfeDetailTestApi {
  document: Signal<IFiscalDocument | null>;
  errorMsg: Signal<string | null>;
  successMsg: Signal<string | null>;
  confirmCancel(reason: string): void;
  confirmEmail(request: IEmailInvoiceRequest): void;
  downloadXml(): void;
  downloadDanfe(): void;
  backToList(): void;
}

const emittedDoc: IFiscalDocument = {
  id: 'NFE-1',
  type: 'NFE',
  origin: 'SALES',
  status: 'EMITTED',
  number: '000.000.001',
  accessKey: '1'.repeat(44),
  value: 350,
  customerName: 'Maria Souza',
  xmlUrl: 'mock://x.xml',
  danfeUrl: 'mock://x.pdf',
};

describe('NfeViewDetailComponent', () => {
  let fiscalService: {
    findById: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    sendEmail: ReturnType<typeof vi.fn>;
  };
  let router: Router;

  const configure = async (id: string | null): Promise<void> => {
    fiscalService = {
      findById: vi.fn().mockReturnValue(of(emittedDoc)),
      cancel: vi.fn(),
      sendEmail: vi.fn().mockReturnValue(of(true)),
    };
    await TestBed.configureTestingModule({
      imports: [NfeViewDetailComponent],
      providers: [
        { provide: FiscalDocumentService, useValue: fiscalService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', id]]) } },
        },
      ],
    }).compileComponents();
    router = TestBed.inject(Router);
  };

  const build = (): ComponentFixture<NfeViewDetailComponent> => {
    const fixture = TestBed.createComponent(NfeViewDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('busca o documento pelo id da rota', async () => {
    await configure('NFE-1');
    const fixture = build();
    expect(fiscalService.findById).toHaveBeenCalledWith('NFE-1');
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    expect(comp.document()).toEqual(emittedDoc);
  });

  it('seta erro quando o id não está presente na rota', async () => {
    await configure(null);
    const fixture = build();
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    expect(comp.errorMsg()).toContain('não informada');
    expect(fiscalService.findById).not.toHaveBeenCalled();
  });

  it('seta erro quando o documento não é encontrado', async () => {
    await configure('NFE-1');
    fiscalService.findById.mockReturnValue(throwError(() => new Error('não encontrada')));
    const fixture = build();
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    expect(comp.errorMsg()).toBe('não encontrada');
  });

  it('cancela o documento e atualiza o status exibido', async () => {
    await configure('NFE-1');
    fiscalService.cancel.mockReturnValue(of({ ...emittedDoc, status: 'CANCELLED' as const }));
    const fixture = build();
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    comp.confirmCancel('Cliente desistiu');
    expect(fiscalService.cancel).toHaveBeenCalledWith(emittedDoc, { reason: 'Cliente desistiu' });
    expect(comp.document()?.status).toBe('CANCELLED');
  });

  it('envia a nota por e-mail usando o documento carregado', async () => {
    await configure('NFE-1');
    const fixture = build();
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    const request = { email: 'cliente@teste.com', includeDanfe: true, includeXml: true };
    comp.confirmEmail(request);
    expect(fiscalService.sendEmail).toHaveBeenCalledWith('NFE-1', request);
    expect(comp.successMsg()).toBe('E-mail enviado.');
  });

  it('inicia os downloads disponíveis no documento mockado', async () => {
    await configure('NFE-1');
    const fixture = build();
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    comp.downloadXml();
    expect(comp.successMsg()).toContain('XML');
    comp.downloadDanfe();
    expect(comp.successMsg()).toContain('documento');
  });

  it('navega de volta para a listagem', async () => {
    await configure('NFE-1');
    const fixture = build();
    const navigateSpy = vi.spyOn(router, 'navigate');
    const comp = fixture.componentInstance as unknown as NfeDetailTestApi;
    comp.backToList();
    expect(navigateSpy).toHaveBeenCalledWith(['/sales/nfe-view']);
  });
});
