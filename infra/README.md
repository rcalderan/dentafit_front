# NFSe Integration Infrastructure

This folder contains the serverless components for processing fiscal backups.

## Components

### 1. AWS Lambda (`nfse-processor`)
- **Runtime**: Node.js 20.x
- **Memory**: 512MB
- **Timeout**: 5 minutes
- **Trigger**: S3 `s3:ObjectCreated:*` on bucket `costume-rental-backups` with prefix `backups/`.

## Deployment Requirements
- S3 Bucket created with CORS allowed for the Angular application host.
- IAM Policy for the Lambda with:
  - `s3:GetObject` on `backups/*`
  - `s3:PutObject` on `processed/*`
  - `ses:SendEmail` for notifications.
- Verified identity on Amazon SES for the sender email.

## Layout Reference
Processed according to:
- `Anexo IV_LeiautesRN_ADN-SNNFSeVia_V1.00 Produção.htm` (National NFSe standard)
- Technical Note NT 2025.12.10 (IBS/CBS taxes)
