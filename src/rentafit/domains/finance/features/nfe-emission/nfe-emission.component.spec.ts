import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NfeEmissionComponent } from './nfe-emission.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import { IFiscalContext, IFiscalDocument } from '../../data/fiscal-document.types';

const paidContext: IFiscalContext = {
  origin: 'SALES',
  originId: 'order-1',
  isPaid: true,
  totalValue: 1234.56,
  customerId: 'cust-1',
  customerName: 'João Silva',
  customerDocument: '12345678901',
  customerEmail: 'joao@email.com',
};

const pendingDoc: IFiscalDocument = {
  id: 'NFE-1',
  type: 'NFE',
  status: 'PENDING_EMISSION',
  value: 1234.56,
  sendProtocol: '1234567890',
};

describe('NfeEmissionComponent', () => {
  let fiscalService: {
    emit: ReturnType<typeof vi.fn>;
    checkStatus: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    reemit: ReturnType<typeof vi.fn>;
    sendEmail: ReturnType<typeof vi.fn>;
    downloadXml: ReturnType<typeof vi.fn>;
    downloadDanfe: ReturnType<typeof vi.fn>;
  };

  const build = (context: IFiscalContext): ComponentFixture<NfeEmissionComponent> => {
    const fixture = TestBed.createComponent(NfeEmissionComponent);
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
      imports: [NfeEmissionComponent],
      providers: [{ provide: FiscalDocumentService, useValue: fiscalService }],
    }).compileComponents();
  });

  it('libera a emissão quando o pedido está pago e sem nota', () => {
    const comp = build(paidContext).componentInstance as any;
    expect(comp.canEmit()).toBe(true);
    expect(comp.status()).toBe('NONE');
  });

  it('bloqueia emissão e seta erro quando o pedido não está pago', () => {
    const comp = build({ ...paidContext, isPaid: false }).componentInstance as any;
    comp.emit();
    expect(fiscalService.emit).not.toHaveBeenCalled();
    expect(comp.errorMsg()).toContain('precisa estar pago');
  });

  it('emite NF-e chamando o serviço e propaga o documento via output', () => {
    const fixture = build(paidContext);
    const comp = fixture.componentInstance as any;
    let changed: IFiscalDocument | undefined;
    fixture.componentInstance.changed.subscribe((d: IFiscalDocument) => (changed = d));

    comp.emit();

    expect(fiscalService.emit).toHaveBeenCalledWith(
      expect.objectContaining({ fiscalDocumentType: 'NFE', origin: 'SALES', value: 1234.56 }),
    );
    expect(comp.status()).toBe('PENDING_EMISSION');
    expect(changed).toEqual(pendingDoc);
  });

  it('reidrata o documento inicial vindo do pedido', () => {
    const fixture = TestBed.createComponent(NfeEmissionComponent);
    fixture.componentRef.setInput('context', paidContext);
    fixture.componentRef.setInput('initialDocument', { ...pendingDoc, status: 'EMITTED' });
    fixture.detectChanges();
    expect((fixture.componentInstance as any).status()).toBe('EMITTED');
  });
});
