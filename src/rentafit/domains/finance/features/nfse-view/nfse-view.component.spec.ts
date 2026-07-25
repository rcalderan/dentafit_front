import { Signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NfseViewComponent } from './nfse-view.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import { IFiscalDocument, IPage } from '../../data/fiscal-document.types';

interface NfseViewTestApi {
  documents: Signal<IFiscalDocument[]>;
  openDocument(id: string): void;
}

const document: IFiscalDocument = {
  id: 'NFSE-1',
  type: 'NFSE',
  origin: 'RENTAL',
  status: 'EMITTED',
  customerName: 'Carlos Silva',
  value: 450,
};

const response: IPage<IFiscalDocument> = {
  content: [document],
  number: 0,
  size: 20,
  totalElements: 1,
  totalPages: 1,
};

describe('NfseViewComponent', () => {
  let fiscalService: { list: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<NfseViewComponent>;
  let router: Router;

  beforeEach(async () => {
    fiscalService = { list: vi.fn().mockReturnValue(of(response)) };
    await TestBed.configureTestingModule({
      imports: [NfseViewComponent],
      providers: [{ provide: FiscalDocumentService, useValue: fiscalService }, provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(NfseViewComponent);
    fixture.detectChanges();
  });

  it('carrega a listagem filtrando por NFSE e origem RENTAL', () => {
    expect(fiscalService.list).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'NFSE', origin: 'RENTAL', page: 0 }),
    );
    expect((fixture.componentInstance as unknown as NfseViewTestApi).documents()).toEqual([document]);
  });

  it('navega para o detalhe da NFS-e selecionada', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    (fixture.componentInstance as unknown as NfseViewTestApi).openDocument('NFSE-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/rental/nfse-view', 'NFSE-1']);
  });
});
