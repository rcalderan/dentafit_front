import { Injectable } from '@angular/core';
import { PathLocationStrategy, PlatformLocation } from '@angular/common';

/**
 * Estratégia de localização que mantém o roteamento interno
 * funcionando normalmente, mas sempre exibe '/' na barra de endereço.
 *
 * - routerLink, routerLinkActive, guards, resolvers — tudo funciona normalmente
 * - Deep links digitados no browser são capturados no primeiro load
 * - Back/forward do navegador continuam funcionais internamente
 */
@Injectable()
export class SilentLocationStrategy extends PathLocationStrategy {

  private initialPath: string | null = null;
  private readonly platformLoc: PlatformLocation;

  constructor(platformLocation: PlatformLocation) {
    super(platformLocation);
    this.platformLoc = platformLocation;
    this.initialPath = this.captureInitialUrl();
  }

  /**
   * Retorna o path real apenas na primeira leitura (deep link support).
   * Nas chamadas subsequentes, sempre retorna '/'.
   */
  override path(includeHash?: boolean): string {
    if (this.initialPath !== null) {
      const captured = this.initialPath;
      this.initialPath = null;
      return captured;
    }
    return '/';
  }

  /** Não altera o path visível no browser ao navegar — mantém '/' */
  override pushState(state: any, title: string, url: string, queryParams: string): void {
    this.platformLoc.replaceState(state, title, this.rootUrl());
  }

  /** Não altera o path visível no browser ao substituir estado — mantém '/' */
  override replaceState(state: any, title: string, url: string, queryParams: string): void {
    this.platformLoc.replaceState(state, title, this.rootUrl());
  }

  private rootUrl(): string {
    return new URL('/', this.platformLoc.href).href;
  }

  private captureInitialUrl(): string {
    const loc = this.platformLoc;
    const path = loc.pathname || '/';
    const search = loc.search || '';
    const hash = loc.hash || '';
    const initial = `${path}${search}${hash}`;

    return initial || '/';
  }
}
