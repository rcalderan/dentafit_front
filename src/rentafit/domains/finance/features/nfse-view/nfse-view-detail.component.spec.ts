import { Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { NfseViewDetailComponent } from './nfse-view-detail.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import { IFiscalDocument } from '../../data/fiscal-document.types';

interface NfseDetailTestApi {
  document: Signal<IFiscalDocument | null>;
}

const document: IFiscalDocument = {
  id: 'NFSE-1',
  type: 'NFSE',
  origin: 'RENTAL',
  status: 'EMITTED',
  serviceDescription: 'Locação de trajes e vestuário',
  value: 450,
};

describe('NfseViewDetailComponent', () => {
  const build = async (): Promise<ComponentFixture<NfseViewDetailComponent>> => {
    const fiscalService = {
      findById: vi.fn().mockReturnValue(of(document)),
      cancel: vi.fn(),
      sendEmail: vi.fn(),
    };
    await TestBed.configureTestingModule({
      imports: [NfseViewDetailComponent],
      providers: [
        { provide: FiscalDocumentService, useValue: fiscalService },
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: new Map([['id', 'NFSE-1']]) } },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NfseViewDetailComponent);
    fixture.detectChanges();
    return fixture;
  };

  it('carrega a NFS-e pelo id da rota e exibe a descrição do serviço', async () => {
    const fixture = await build();
    const component = fixture.componentInstance as unknown as NfseDetailTestApi;
    expect(component.document()).toEqual(document);
    expect(fixture.nativeElement.textContent).toContain('Locação de trajes e vestuário');
  });
});
