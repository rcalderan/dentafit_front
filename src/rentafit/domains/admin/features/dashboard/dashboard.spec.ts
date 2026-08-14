import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';
import { Dashboard } from './dashboard';
import { CertificateService } from '../../service/certificate.service';
import { IssuerSetupService } from '../../../auth/services/issuer-setup.service';
import { APP_CONFIG } from '../../../../shared/data/app-config.token';
import { IssuerBranchSetupRequest, IssuerInfo } from '../../../auth/data/issuer.model';

const buildIssuer = (overrides: Partial<IssuerInfo> = {}): IssuerInfo => ({
  cnpj: '08299621000120',
  rootCnpj: '08299621',
  branchOrder: '0001',
  digitoControle: '20',
  matriz: true,
  razaoSocial: 'Emitente Teste',
  crt: '1',
  logradouro: 'Rua Teste',
  numero: '0',
  bairro: 'Centro',
  municipioCodigo: '3548906',
  municipioNome: 'Sao Carlos',
  uf: 'SP',
  cep: '13560000',
  paisCodigo: '1058',
  paisNome: 'BRASIL',
  certificateConfigured: false,
  ...overrides,
} as IssuerInfo);

const baseCertificate = {
  valido: true,
  cnpjCpf: '08299621000120',
  vencimento: '2027-01-01',
  diasRestantes: 365,
};

describe('Dashboard', () => {
  let certificateService: {
    status: ReturnType<typeof vi.fn>;
    upload: ReturnType<typeof vi.fn>;
  };
  let issuerSetupService: {
    getCurrentIssuer: ReturnType<typeof vi.fn>;
    listBranches: ReturnType<typeof vi.fn>;
    configureIssuer: ReturnType<typeof vi.fn>;
    configureBranch: ReturnType<typeof vi.fn>;
  };

  const makeComponent = () => {
    const fixture = TestBed.createComponent(Dashboard);
    fixture.detectChanges();
    return fixture.componentInstance;
  };

  beforeEach(async () => {
    certificateService = {
      status: vi.fn().mockReturnValue(of(baseCertificate)),
      upload: vi.fn(),
    };
    issuerSetupService = {
      getCurrentIssuer: vi.fn().mockReturnValue(of(null)),
      listBranches: vi.fn().mockReturnValue(of([])),
      configureIssuer: vi.fn(),
      configureBranch: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        { provide: CertificateService, useValue: certificateService },
        { provide: IssuerSetupService, useValue: issuerSetupService },
        { provide: ActivatedRoute, useValue: {} },
        { provide: APP_CONFIG, useValue: { apiBaseUrl: '/api' } },
      ],
    }).compileComponents();
  });

  it('cria o componente', () => {
    const component = makeComponent();
    expect(component).toBeTruthy();
  });

  it('carrega status, emitente e filiais ao inicializar', () => {
    issuerSetupService.listBranches.mockReturnValue(of([buildIssuer()]));
    makeComponent();

    expect(certificateService.status).toHaveBeenCalled();
    expect(issuerSetupService.getCurrentIssuer).toHaveBeenCalled();
    expect(issuerSetupService.listBranches).toHaveBeenCalled();
  });

  describe('loadBranches', () => {
    it('exibe filiais retornadas pelo backend', () => {
      const branches = [
        buildIssuer(),
        buildIssuer({
          cnpj: '08299621000200',
          matriz: false,
          nomeFantasia: 'Filial Centro',
        }),
      ];
      issuerSetupService.listBranches.mockReturnValue(of(branches));

      const component = makeComponent();

      expect(component.branches()).toEqual(branches);
      expect(component.branchLoading()).toBe(false);
      expect(component.branchError()).toBeNull();
    });

    it('exibe mensagem de erro quando a listagem falha', () => {
      issuerSetupService.listBranches.mockReturnValue(throwError(() => new Error('Erro ao listar filiais')));

      const component = makeComponent();

      expect(component.branches()).toEqual([]);
      expect(component.branchError()).toBe('Erro ao listar filiais');
      expect(component.branchLoading()).toBe(false);
    });
  });

  describe('toggleBranchForm', () => {
    it('alterna a exibição do formulário e limpa erros', () => {
      const component = makeComponent();
      component.branchError.set('erro anterior');

      component.toggleBranchForm();
      expect(component.showBranchForm()).toBe(true);
      expect(component.branchError()).toBeNull();

      component.toggleBranchForm();
      expect(component.showBranchForm()).toBe(false);
    });
  });

  describe('submitBranch', () => {
    it('exibe erro quando o CNPJ está incompleto', () => {
      const component = makeComponent();
      component.branchCnpj = '123';
      component.branchLogradouro = 'Rua';
      component.branchNumero = '1';
      component.branchBairro = 'Centro';
      component.branchMunicipioCodigo = '3548906';
      component.branchMunicipioNome = 'Sao Carlos';
      component.branchUf = 'SP';
      component.branchCep = '13560000';

      component.submitBranch();

      expect(component.branchError()).toBe('CNPJ da filial deve conter 14 dígitos.');
      expect(issuerSetupService.configureBranch).not.toHaveBeenCalled();
    });

    it('exibe erro quando o CNPJ termina em 0001 (matriz)', () => {
      const component = makeComponent();
      component.branchCnpj = '08299621000120';
      component.branchLogradouro = 'Rua';
      component.branchNumero = '1';
      component.branchBairro = 'Centro';
      component.branchMunicipioCodigo = '3548906';
      component.branchMunicipioNome = 'Sao Carlos';
      component.branchUf = 'SP';
      component.branchCep = '13560000';

      component.submitBranch();

      expect(component.branchError()).toBe('CNPJ da filial deve ter sufixo diferente de 0001 (matriz).');
      expect(issuerSetupService.configureBranch).not.toHaveBeenCalled();
    });

    it('envia requisição de cadastro e recarrega a lista de filiais', () => {
      issuerSetupService.configureBranch.mockReturnValue(of(buildIssuer({
        cnpj: '08299621000200',
        matriz: false,
      })));

      const component = makeComponent();
      fillValidBranchForm(component);

      component.submitBranch();

      const request: IssuerBranchSetupRequest = {
        cnpj: '08299621000200',
        nomeFantasia: 'Filial Centro',
        ie: '123456',
        im: undefined,
        fone: undefined,
        logradouro: 'Rua Filial',
        numero: '1',
        bairro: 'Centro',
        municipioCodigo: '3548906',
        municipioNome: 'Sao Carlos',
        uf: 'SP',
        cep: '13560000',
      };
      expect(issuerSetupService.configureBranch).toHaveBeenCalledWith(request);
      expect(component.showBranchForm()).toBe(false);
      expect(issuerSetupService.listBranches).toHaveBeenCalledTimes(2); // ngOnInit + após sucesso
    });

    it('exibe mensagem de erro quando o cadastro falha', () => {
      issuerSetupService.configureBranch.mockReturnValue(throwError(() => new Error('Matriz não cadastrada')));

      const component = makeComponent();
      fillValidBranchForm(component);

      component.submitBranch();

      expect(component.branchError()).toBe('Matriz não cadastrada');
      expect(component.branchSaving()).toBe(false);
    });
  });
});

function fillValidBranchForm(component: Dashboard): void {
  component.branchCnpj = '08.299.621/0002-00';
  component.branchNomeFantasia = 'Filial Centro';
  component.branchIe = '123456';
  component.branchIm = '';
  component.branchFone = '';
  component.branchLogradouro = 'Rua Filial';
  component.branchNumero = '1';
  component.branchBairro = 'Centro';
  component.branchMunicipioCodigo = '3548906';
  component.branchMunicipioNome = 'Sao Carlos';
  component.branchUf = 'sp';
  component.branchCep = '13560-000';
}
