import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { JSEncrypt } from 'jsencrypt';
import bcrypt from "bcryptjs";
import { APP_CONFIG } from '../../../shared/data/app-config.token';


@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private readonly config = inject(APP_CONFIG);
  private readonly apiUrl = `${this.config.apiBaseUrl}/api/auth`;
  private publicKey: string | null = null;
  private jsEncrypt: JSEncrypt = new JSEncrypt();

  constructor(private http: HttpClient) {}

  /**
   * Obtém a chave pública do backend e armazena em cache.
   * Chamadas subsequentes retornam o valor em cache.
   */
  getPublicKey(): Observable<string> {
    if (this.publicKey) {
      return of(this.publicKey);
    }

    return this.http.get<{ publicKey: string }>(`${this.apiUrl}/public-key`).pipe(
      catchError((response) => {
        console.error('Erro ao obter a chave pública:', response);
        throw new Error('Falha ao obter a chave pública');
      }),
      map(response => response.publicKey),
      tap(key => {
        this.publicKey = key;
        this.jsEncrypt.setPublicKey(key);
      })
    );
  }

  encryptWithBcrypt(data: string): string {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(data, salt);
  }

  /**
   * Criptografa dados utilizando a chave pública RSA.
   * Automaticamente busca a chave pública se ainda não estiver em cache.
   * @param data String a ser criptografada
   * @returns Observable com string criptografada em Base64
   */
  encrypt(data: string): Observable<string> {
    return this.getPublicKey().pipe(
      map(() => {
        const encrypted = this.jsEncrypt.encrypt(data);
        if (!encrypted) {
          throw new Error('Falha ao criptografar dados');
        }
        return encrypted;
      })
    );
  }

  /**
   * Limpa o cache da chave pública.
   * Útil em casos de rotação de chaves no backend.
   */
  clearCache(): void {
    this.publicKey = null;
    this.jsEncrypt = new JSEncrypt();
  }
}
