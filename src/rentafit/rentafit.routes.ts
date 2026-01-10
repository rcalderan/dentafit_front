import { Routes } from '@angular/router';
import { Login } from './domains/auth/features/login/login';
import { MainLayout } from './shared/layout/main-layout/main-layout';

export const routes: Routes = [
    { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
    { path: 'auth/login', component: Login },
    {
        path: '',
        component: MainLayout,
        children: [
            {
                path: 'customer/registration',
                loadComponent: () => import('./domains/customer/features/registration/registration').then(m => m.Registration)
            },
            {
                path: 'customer/legacy',
                loadComponent: () => import('./domains/customer/features/legacy/clientes/clientes').then(m => m.ClientesLegacy)
            },
            {
                path: 'customer/clothes',
                loadComponent: () => import('./domains/product/features/legacy/clothes/clothes').then(m => m.Clothes)
            },
            {
                path: 'customer/search',
                loadComponent: () => import('./domains/customer/features/search/search').then(m => m.Search)
            },
            {
                path: 'product/registration',
                loadComponent: () => import('./domains/product/features/registration/registration').then(m => m.Registration)
            },
            {
                path: 'product/search',
                loadComponent: () => import('./domains/product/features/search/search').then(m => m.Search)
            },
            {
                path: 'product/stock',
                loadComponent: () => import('./domains/product/features/stock/stock').then(m => m.Stock)
            },
            {
                path: 'rental/new',
                loadComponent: () => import('./domains/rental/features/new-rental/new-rental').then(m => m.NewRental)
            },
            {
                path: 'rental/management',
                loadComponent: () => import('./domains/rental/features/management/management').then(m => m.Management)
            },
            {
                path: 'rental/legacy',
                loadComponent: () => import('./domains/rental/features/legacy/locacao/locacao').then(m => m.LocacaoComponent)
            },
            {
                path: 'customer/devolucao-legacy',
                loadComponent: () => import('./domains/customer/features/legacy/devolucao/devolucao').then(m => m.DevolucaoLegacy)
            },
            {
                path: 'finance/relatorio-locacao-legacy',
                loadComponent: () => import('./domains/finance/features/legacy/relatorios/relatorio-locacao').then(m => m.RelatorioLocacaoLegacy)
            },
            {
                path: 'finance/relatorio-devolucao-legacy',
                loadComponent: () => import('./domains/finance/features/legacy/relatorios/relatorio-devolucao').then(m => m.RelatorioDevolucaoLegacy)
            },
            {
                path: 'finance/dashboard',
                loadComponent: () => import('./domains/finance/features/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'finance/nfse-backup',
                loadComponent: () => import('./domains/finance/features/nfse-upload/nfse-upload').then(m => m.NfseUpload)
            },
            {
                path: 'admin/dashboard',
                loadComponent: () => import('./domains/admin/features/dashboard/dashboard').then(m => m.Dashboard)
            }
        ]
    }
];
