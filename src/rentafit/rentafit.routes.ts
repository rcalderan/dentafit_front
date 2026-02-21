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
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] }
            },
            {
                path: 'customer/legacy',
                loadComponent: () => import('./domains/customer/features/legacy/clientes/clientes').then(m => m.ClientesLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            },
            {
                path: 'product/registration',
                loadComponent: () => import('./domains/product/components/rent-registration/rent-registration.component').then(m => m.Registration),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] }
            },
            {
                path: 'product/retail-registration',
                loadComponent: () => import('./domains/product/components/retail-registration/retail-registration.component').then(m => m.RetailRegistration),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] }
            },
            {
                path: 'product/search',
                loadComponent: () => import('./domains/product/components/search/search').then(m => m.Search)
            },
            {
                path: 'product/stock',
                loadComponent: () => import('./domains/product/components/stock/stock').then(m => m.Stock),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] }
            },
            {
                path: 'rental/new',
                loadComponent: () => import('./domains/rental/features/new-rental/new-rental').then(m => m.NewRental),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] }
            },
            {
                path: 'rental/management',
                loadComponent: () => import('./domains/rental/features/management/management').then(m => m.Management),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.EMPLOYEE] }
            },
            {
                path: 'rental/legacy',
                loadComponent: () => import('./domains/rental/features/legacy/locacao/locacao').then(m => m.LocacaoComponent),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            },
            {
                path: 'customer/devolucao-legacy',
                loadComponent: () => import('./domains/customer/features/legacy/devolucao/devolucao').then(m => m.DevolucaoLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            },
            {
                path: 'finance/relatorio-locacao-legacy',
                loadComponent: () => import('./domains/finance/features/legacy/relatorios/relatorio-locacao').then(m => m.RelatorioLocacaoLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            },
            {
                path: 'finance/relatorio-devolucao-legacy',
                loadComponent: () => import('./domains/finance/features/legacy/relatorios/relatorio-devolucao').then(m => m.RelatorioDevolucaoLegacy),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN] }
            },
            {
                path: 'finance/dashboard',
                loadComponent: () => import('./domains/finance/features/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER] }
            },
            {
                path: 'finance/nfse-backup',
                loadComponent: () => import('./domains/finance/features/nfse-upload/nfse-upload').then(m => m.NfseUpload),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER] }
            },
            {
                path: 'admin/dashboard',
                loadComponent: () => import('./domains/admin/features/dashboard/dashboard').then(m => m.Dashboard),
                canActivate: [roleGuard],
                data: { roles: [UserRole.ADMIN, UserRole.MANAGER] }
            }
        ]
    },
    { path: '**', redirectTo: 'auth/login' }
];
