import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NfeEmissionComponent } from './nfe-emission.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import { CustomerService } from '../../../customer/service/customer.service';
import { ICustomer } from '../../../customer/data/Customer.interface';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';
import { IFiscalContext, IFiscalDocument } from '../../data/fiscal-document.types';

const appConfig = {
  appName: 'RentAFit Test',
  apiBaseUrl: '',
  s3BucketUrl: '',
  fiscalDefaults: {
    nfse: {
      nbsCode: '1.0101',
      cityCode: '3550308',
      serviceDescription: 'Locação de trajes e vestuário',
      ibsRate: 0.025,
      cbsRate: 0.015,
      isqnRate: 0.0,
    },
    nfe: {
      ncm: '95059000',
      cfop: '5102',
      unit: 'UN',
    },
  },
};

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

const paidContextWithItems: IFiscalContext = {
  ...paidContext,
  items: [
    {
      productCode: 'SKU-001',
      description: 'Fantasia',
      ncm: '',
      cfop: '',
      unit: 'UN',
      quantity: 1,
      unitValue: 1234.56,
    },
  ],
};

const customer: ICustomer = {
  id: 'cust-1',
  name: 'João Silva',
  document: '123.456.789-01',
  email: 'joao@email.com',
  isAuthenticated: true,
  notes: '',
  complement: '',
  number: '100',
  phones: [],
  address: {
    zipCode: '13560-000',
    street: 'Rua do Cliente',
    neighborhood: 'Centro',
    city: 'Sao Carlos',
    state: 'SP',
  },
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
    save: ReturnType<typeof vi.fn>;
    checkStatus: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    reemit: ReturnType<typeof vi.fn>;
    sendEmail: ReturnType<typeof vi.fn>;
    downloadXml: ReturnType<typeof vi.fn>;
    downloadDanfe: ReturnType<typeof vi.fn>;
  };
  let customerService: { getCustomerById: ReturnType<typeof vi.fn> };

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
      save: vi.fn().mockReturnValue(of(pendingDoc)),
      checkStatus: vi.fn(),
      cancel: vi.fn(),
      reemit: vi.fn(),
      sendEmail: vi.fn(),
      downloadXml: vi.fn(),
      downloadDanfe: vi.fn(),
    };
    customerService = {
      getCustomerById: vi.fn().mockReturnValue(of(customer)),
    };
    await TestBed.configureTestingModule({
      imports: [NfeEmissionComponent],
      providers: [
        { provide: FiscalDocumentService, useValue: fiscalService },
        { provide: CustomerService, useValue: customerService },
        { provide: APP_CONFIG, useValue: appConfig },
      ],
    }).compileComponents();
  });

  it('libera a emissão quando o pedido está pago e sem nota', () => {
    const comp = build(paidContextWithItems).componentInstance as any;
    expect(comp.canEmit()).toBe(true);
    expect(comp.status()).toBe('NONE');
  });

  it('bloqueia emissão e seta erro quando o pedido não está pago', () => {
    const comp = build({ ...paidContextWithItems, isPaid: false }).componentInstance as any;
    comp.emit();
    expect(fiscalService.emit).not.toHaveBeenCalled();
    expect(comp.errorMsg()).toContain('precisa estar pago');
  });

  it('busca dados do cliente ao receber o contexto', () => {
    build(paidContextWithItems);
    expect(customerService.getCustomerById).toHaveBeenCalledWith('cust-1');
  });

  it('emite NF-e chamando o serviço e propaga o documento via output', () => {
    const fixture = build(paidContextWithItems);
    const comp = fixture.componentInstance as any;
    let changed: IFiscalDocument | undefined;
    fixture.componentInstance.changed.subscribe((d: IFiscalDocument) => (changed = d));

    comp.emit();

    expect(fiscalService.emit).toHaveBeenCalledWith(
      expect.objectContaining({
        fiscalDocumentType: 'NFE',
        origin: 'SALES',
        value: 1234.56,
        customer: expect.objectContaining({
          name: 'João Silva',
          document: '12345678901',
        }),
      }),
    );
    expect(fiscalService.save).toHaveBeenCalledWith(pendingDoc);
    expect(comp.status()).toBe('PENDING_EMISSION');
    expect(changed).toEqual(pendingDoc);
  });

  it('reidrata o documento inicial vindo do pedido', () => {
    const fixture = TestBed.createComponent(NfeEmissionComponent);
    fixture.componentRef.setInput('context', paidContextWithItems);
    fixture.componentRef.setInput('initialDocument', { ...pendingDoc, status: 'EMITTED' });
    fixture.detectChanges();
    expect((fixture.componentInstance as any).status()).toBe('EMITTED');
  });

  it('exibe erro na UI quando os dados do cliente estão incompletos', () => {
    TestBed.overrideProvider(CustomerService, {
      useValue: { getCustomerById: vi.fn().mockReturnValue(of(null)) },
    });
    const fixture = build({ ...paidContextWithItems, customerId: 'unknown' });
    fixture.detectChanges();
    const comp = fixture.componentInstance as any;
    comp.emit();
    expect(comp.errorMsg()).toContain('Cliente não encontrado');
  });

  it('regressão: initialDocument=null (backend PENDING_EMISSION mapeado) mostra botão Emitir', () => {
    const comp = build(paidContextWithItems).componentInstance as any;
    expect(comp.status()).toBe('NONE');
    expect(comp.canEmit()).toBe(true);
  });
});
