import { Signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NfeViewComponent } from './nfe-view.component';
import { FiscalDocumentService } from '../../service/fiscal-document.service';
import { IFiscalDocument, IPage } from '../../data/fiscal-document.types';

const page = (content: IFiscalDocument[]): IPage<IFiscalDocument> => ({
  content,
  number: 0,
  size: 20,
  totalElements: content.length,
  totalPages: 1,
});

interface NfeViewTestApi {
  documents: Signal<IFiscalDocument[]>;
  errorMsg: Signal<string | null>;
  onFilterChange(status: 'EMITTED'): void;
  openDocument(id: string): void;
}

const doc: IFiscalDocument = {
  id: 'NFE-1',
  type: 'NFE',
  origin: 'SALES',
  status: 'EMITTED',
  customerName: 'Maria Souza',
  value: 350,
};

describe('NfeViewComponent', () => {
  let fiscalService: { list: ReturnType<typeof vi.fn> };
  let fixture: ComponentFixture<NfeViewComponent>;
  let router: Router;

  const build = (): ComponentFixture<NfeViewComponent> => {
    const created = TestBed.createComponent(NfeViewComponent);
    created.detectChanges();
    return created;
  };

  beforeEach(async () => {
    fiscalService = { list: vi.fn().mockReturnValue(of(page([doc]))) };
    await TestBed.configureTestingModule({
      imports: [NfeViewComponent],
      providers: [{ provide: FiscalDocumentService, useValue: fiscalService }, provideRouter([])],
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('carrega a listagem filtrando por NFE e origem SALES', () => {
    fixture = build();
    expect(fiscalService.list).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'NFE', origin: 'SALES', page: 0 }),
    );
    const comp = fixture.componentInstance as unknown as NfeViewTestApi;
    expect(comp.documents()).toEqual([doc]);
  });

  it('atualiza o filtro de status e recarrega a página inicial', () => {
    fixture = build();
    const comp = fixture.componentInstance as unknown as NfeViewTestApi;
    comp.onFilterChange('EMITTED');
    expect(fiscalService.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: 'EMITTED', page: 0 }),
    );
  });

  it('navega para o detalhe ao abrir um documento', () => {
    fixture = build();
    const navigateSpy = vi.spyOn(router, 'navigate');
    const comp = fixture.componentInstance as unknown as NfeViewTestApi;
    comp.openDocument('NFE-1');
    expect(navigateSpy).toHaveBeenCalledWith(['/sales/nfe-view', 'NFE-1']);
  });

  it('define mensagem de erro quando a listagem falha', () => {
    fiscalService.list.mockReturnValue(throwError(() => new Error('falha ao listar')));
    fixture = build();
    const comp = fixture.componentInstance as unknown as NfeViewTestApi;
    expect(comp.errorMsg()).toBe('falha ao listar');
  });
});
