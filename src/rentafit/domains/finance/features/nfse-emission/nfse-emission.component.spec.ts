import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NfseEmissionComponent } from './nfse-emission.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import { IFiscalContext, IFiscalDocument } from '../../data/fiscal-document.types';

const paidContext: IFiscalContext = {
  origin: 'RENTAL',
  originId: 'contract-1',
  isPaid: true,
  totalValue: 800,
  customerId: 'cust-1',
  customerName: 'Maria Souza',
  customerDocument: '98765432100',
};

const pendingDoc: IFiscalDocument = {
  id: 'NFSE-1',
  type: 'NFSE',
  status: 'PENDING_EMISSION',
  value: 800,
};

describe('NfseEmissionComponent', () => {
  let fiscalService: {
    emit: ReturnType<typeof vi.fn>;
    checkStatus: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    reemit: ReturnType<typeof vi.fn>;
    sendEmail: ReturnType<typeof vi.fn>;
    downloadXml: ReturnType<typeof vi.fn>;
    downloadDanfe: ReturnType<typeof vi.fn>;
  };

  const build = (context: IFiscalContext): ComponentFixture<NfseEmissionComponent> => {
    const fixture = TestBed.createComponent(NfseEmissionComponent);
    fixture.componentRef.setInput('context', context);
    fixture.componentRef.setInput('initialDocument', null);
    fixture.detectChanges();
    return fixture;
  };

  beforeEach(async () => {
    fiscalService = {
      emit: vi.fn().mockReturnValue(of(pendingDoc)),
      checkStatus: vi.fn(),
      cancel: vi.fn(),
      reemit: vi.fn(),
      sendEmail: vi.fn(),
      downloadXml: vi.fn(),
      downloadDanfe: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [NfseEmissionComponent],
      providers: [{ provide: FiscalDocumentService, useValue: fiscalService }],
    }).compileComponents();
  });

  it('monta a requisição de NFS-e com origem RENTAL e campos de serviço', () => {
    const comp = build(paidContext).componentInstance as any;
    comp.emit();
    expect(fiscalService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        fiscalDocumentType: 'NFSE',
        origin: 'RENTAL',
        value: 800,
        serviceDescription: 'Locação de trajes e vestuário',
      }),
    );
  });

  it('exige documento do cliente para sinalizar emissão completa', () => {
    const comp = build({ ...paidContext, customerDocument: '' }).componentInstance as any;
    expect(comp.hasCustomerDocument()).toBe(false);
  });
});
