# Mockup — Seção de Controle de Emissão NF-e (novo pedido de venda)

## Comportamento por Status

### Status: `NONE` (Nenhuma NF-e)

```
┌─────────────────────────────────────────────────────────────┐
│  NF-e (Nota Fiscal Eletrônica)                              │
│                                                             │
│  Status: Nenhuma nota emitida                               │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tipo de Documento Fiscal:                           │   │
│  │  ● NF-e (modelo 55)  ○ NFS-e (modelo 65)           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Natureza da Operação:                               │   │
│  │  [ Venda de mercadoria                           ]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Finalidade:                                          │   │
│  │  ● Normal  ○ Complementar  ○ Ajuste  ○ Devolução    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  Emitir NF-e         │  │  Emitir NFS-e (serviço)  │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                             │
│  ℹ️ Necessário que o pedido esteja com status "Pago"       │
│    para emitir a nota fiscal.                               │
└─────────────────────────────────────────────────────────────┘
```

### Status: `PENDING_EMISSION` (Em processamento)

```
┌─────────────────────────────────────────────────────────────┐
│  NF-e (Nota Fiscal Eletrônica)                              │
│                                                             │
│  Status: ⏳ Em processamento...                             │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  ⏳ Aguardando retorno da SEFAZ...                    │   │
│  │  Protocolo de Envio: 3525060001234567890123456789012 │   │
│  │  Data/Hora Envio: 21/06/2026 14:35:22                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  🔄 Verificar Status │  │  Cancelar Emissão       │    │
│  └──────────────────────┘  └──────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Status: `EMITTED` (Emitida)

```
┌─────────────────────────────────────────────────────────────┐
│  NF-e (Nota Fiscal Eletrônica)                              │
│                                                             │
│  Status: ✅ Emitida com sucesso                             │
│                                                             │
│  ┌─────── Informações da NF-e ──────────────────────────┐   │
│  │                                                       │   │
│  │  Número:             000.123.456                     │   │
│  │  Série:              1                               │   │
│  │  Chave de Acesso:    3525060001234567890123456789012 │   │
│  │                      34567890123456                   │   │
│  │  Data de Emissão:    21/06/2026 14:36:10             │   │
│  │  Valor:              R$ 1.234,56                     │   │
│  │  Protocolo:          352506123456789                  │   │
│  │  DF-e ID:            NF-e-35250600012345678901234... │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  📄 Download XML     │  │  🖨️ Download DANFE (PDF) │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐    │
│  │  🖨️ Imprimir DANFE   │  │  Enviar XML por E-mail  │    │
│  └──────────────────────┘  └──────────────────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Cancelar NF-e (vermelho/alerta)                     │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ℹ️ Justificativa de cancelamento deve ser informada       │
│    dentro do prazo legal (24h).                             │
└─────────────────────────────────────────────────────────────┘
```

### Status: `CANCELLED` (Cancelada)

```
┌─────────────────────────────────────────────────────────────┐
│  NF-e (Nota Fiscal Eletrônica)                              │
│                                                             │
│  Status: ❌ Cancelada                                       │
│                                                             │
│  ┌─────── Informações do Cancelamento ─────────────────┐   │
│  │                                                       │   │
│  │  Número NF-e:        000.123.456                     │   │
│  │  Chave de Acesso:    3525060001234567890123456789012 │   │
│  │  Data Cancelamento:  22/06/2026 09:15:00             │   │
│  │  Protocolo:          352506987654321                  │   │
│  │  Motivo:             "Mercadoria devolvida pelo      │   │
│  │                       cliente antes da retirada"     │   │
│  │                                                       │   │
│  └───────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  📄 Download XML de Cancelamento                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────────────┐                           │
│  │  Reemitir NF-e              │                           │
│  └──────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Modal de Cancelamento de NF-e

```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️ Cancelar NF-e                                           │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Número NF-e:    000.123.456                         │   │
│  │  Chave de Acesso: 3525060001234567890123456789012345 │   │
│  │  Valor:           R$ 1.234,56                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  Motivo do Cancelamento *                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [Venda cancelada por desistência do cliente      ]   │   │
│  │ [                                                  ]   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ⚠️ O cancelamento só é permitido em até 24h após a        │
│     emissão da nota fiscal. Após este prazo, é necessário   │
│     realizar uma NF-e de devolução.                         │
│                                                             │
│  ┌──────────┐  ┌──────────────────────┐                    │
│  │  Voltar  │  │  Confirmar           │                    │
│  └──────────┘  └──────────────────────┘                    │
│                   Cancelamento (vermelho)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Modal de Envio por E-mail

```
┌─────────────────────────────────────────────────────────────┐
│  Enviar NF-e por E-mail                                     │
│                                                             │
│  NF-e: 000.123.456 — Série 1                               │
│  Cliente: João Silva — joao@email.com                      │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  E-mail alternativo (opcional):                       │   │
│  │  [                                                 ] │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ☑ Incluir DANFE em PDF no anexo                           │
│  ☑ Incluir XML da NF-e no anexo                            │
│                                                             │
│  ┌──────────┐  ┌──────────────────────┐                    │
│  │  Voltar  │  │  Enviar              │                    │
│  └──────────┘  └──────────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Sugestão de Novos Campos na Interface `ISalesOrder`

```typescript
export interface ISalesOrder {
  // ... campos existentes ...
  
  // NF-e
  invoiceStatus: InvoiceStatusApi;
  invoiceStatusDescription?: string;
  invoiceId?: string;
  
  // NOVOS campos sugeridos:
  invoiceNumber?: string;           // Número da NF-e (ex: 000.123.456)
  invoiceSeries?: string;           // Série (ex: "1")
  invoiceAccessKey?: string;        // Chave de Acesso (44 dígitos)
  invoiceEmissionDate?: string;     // Data/Hora de emissão
  invoiceProtocol?: string;         // Protocolo de autorização SEFAZ
  invoiceCancelReason?: string;     // Motivo de cancelamento
  invoiceCancelledAt?: string;      // Data de cancelamento
  invoiceCancelProtocol?: string;   // Protocolo de cancelamento
  invoiceXmlUrl?: string;           // URL para download do XML
  invoiceDanfeUrl?: string;         // URL para download do DANFE (PDF)
  invoiceCustomerEmail?: string;    // E-mail do cliente para envio
  invoiceNatureOperation?: string;  // Natureza da operação
  invoicePurpose?: string;          // Finalidade (normal, complementar, etc.)
}
```

---

## Sugestão de Novos Tipos

```typescript
// Ampliar o enum de status de NF-e
export type InvoiceStatusApi = 
  | 'NONE'             // Nenhuma nota
  | 'PENDING_EMISSION' // Em processamento
  | 'EMITTED'          // Emitida com sucesso
  | 'CANCELLED'        // Cancelada
  | 'DENIED';          // Negada pela SEFAZ

export type InvoicePurposeApi = 'NORMAL' | 'COMPLEMENTARY' | 'ADJUSTMENT' | 'RETURN';

export interface IEmitInvoiceRequest {
  customerEmail?: string;
  natureOperation?: string;
  purpose?: InvoicePurposeApi;
  fiscalDocumentType: 'NFE' | 'NFSE';
  cfop?: string;              // Código Fiscal de Operações e Prestações
}

export interface ICancelInvoiceRequest {
  reason: string;
}
```

---

## Regras de Negócio

| Condição | Comportamento |
|---|---|
| `status !== 'PAID'` | Botão "Emitir NF-e" desabilitado com tooltip "Pedido precisa estar pago" |
| `invoiceStatus === 'EMITTED'` | Mostrar dados completos da NF-e + botões de ação |
| `invoiceStatus === 'CANCELLED'` | Mostrar dados do cancelamento + botão "Reemitir" |
| Cliente sem CPF/CNPJ | Exibir aviso: "Cliente precisa de CPF/CNPJ para emissão de NF-e" |
| Venda balcão (sem cliente) | Emitir NF-e com CPF/CNPJ genérico de consumidor final |
