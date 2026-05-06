import { Routes } from '@angular/router';
import { Login } from './domains/auth/features/login/login.component';
import { MainLayout } from './shared/layout/main-layout/main-layout';
import { authGuard } from './domains/auth/guards/auth.guard';
import { roleGuard } from './domains/auth/guards/role.guard';
import { UserRole } from './domains/auth/data/user.model';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/login', component: Login },
    {
        path: '',
        component: MainLayout,
        canActivate: [authGuard],
        children: [
            {
                path: 'customer/registration',
                loadComponent: () => import('./domains/customer/features/registration/registration.component').then(m => m.RegistrationComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Clientes' }
            },
            {
                path: 'customer/legacy',
                loadComponent: () => import('./domains/customer/features/legacy/clientes/clientes').then(m => m.ClientesLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN], title: 'Clientes (Legacy)' }
            },
            {
                path: 'product/registration',
                loadComponent: () => import('./domains/product/components/rent-registration/rent-registration.component').then(m => m.Registration),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Cadastro de Produtos' }
            },
            {
                path: 'product/retail-registration',
                loadComponent: () => import('./domains/product/components/retail-registration/retail-registration.component').then(m => m.RetailRegistration),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Produtos para Venda' }
            },
            {
                path: 'product/search',
                loadComponent: () => import('./domains/product/components/search/search').then(m => m.Search),
                data: { title: 'Busca de Produtos' }
            },
            {
                path: 'product/stock',
                loadComponent: () => import('./domains/product/components/stock/stock').then(m => m.Stock),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Estoque' }
            },
            {
                path: 'rental/new',
                loadComponent: () => import('./domains/rental/features/new-rental/new-rental.component').then(m => m.NewRental),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Nova Locação' }
            },
            {
                path: 'rental/management',
                loadComponent: () => import('./domains/rental/features/management/management').then(m => m.Management),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Gestão de Locações' }
            },
            {
                path: 'rental/return/:contractId',
                loadComponent: () => import('./domains/rental/features/return/return.component').then(m => m.ReturnComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Devolução' }
            },
            {
                path: 'rental/legacy',
                loadComponent: () => import('./domains/rental/features/legacy/locacao/locacao').then(m => m.LocacaoComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN], title: 'Locação (Legacy)' }
            },
            {
                path: 'customer/devolucao-legacy',
                loadComponent: () => import('./domains/customer/features/legacy/devolucao/devolucao').then(m => m.DevolucaoLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN], title: 'Devolução (Legacy)' }
            },
            {
                path: 'finance/relatorio-locacao-legacy',
                loadComponent: () => import('./domains/finance/features/legacy/relatorios/relatorio-locacao').then(m => m.RelatorioLocacaoLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN], title: 'Relatório de Locação' }
            },
            {
                path: 'finance/relatorio-devolucao-legacy',
                loadComponent: () => import('./domains/finance/features/legacy/relatorios/relatorio-devolucao').then(m => m.RelatorioDevolucaoLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN], title: 'Relatório de Devolução' }
            },
            {
                path: 'sales/new',
                loadComponent: () => import('./domains/sales/features/new-sale/new-sale.component').then(m => m.NewSale),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Nova Venda' }
            },
            {
                path: 'sales/management',
                loadComponent: () => import('./domains/sales/features/management/sales-management.component').then(m => m.SalesManagement),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Gestão de Vendas' }
            },
            {
                path: 'home/dashboard',
                loadComponent: () => import('./domains/home/features/dashboard.component').then(m => m.HomeDashboard),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE], title: 'Dashboard' }
            },
            {
                path: 'finance/dashboard',
                loadComponent: () => import('./domains/finance/features/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER], title: 'Financeiro' }
            },
            {
                path: 'finance/nfse-backup',
                loadComponent: () => import('./domains/finance/features/nfse-upload/nfse-upload').then(m => m.NfseUpload),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER], title: 'NFS-e Backup' }
            },
            {
                path: 'admin/dashboard',
                loadComponent: () => import('./domains/admin/features/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER], title: 'Administração' }
            }
        ]
    },
    { path: '**', redirectTo: 'auth/login' }
];
