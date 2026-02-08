/**
 * AWS Lambda - NFSe Integration Processor
 * Trigger: S3 ObjectCreated (prefix: backups/)
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const s3 = new S3Client({});
const ses = new SESClient({});

export const handler = async (event) => {
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    try {
        console.log(`Processing file: ${bucket}/${key}`);

        // 1. Get the uploaded file
        const response = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        const content = await response.Body.transformToString();

        // 2. Process logic (Placeholder for NFSe Layout Integration)
        // Here we would parse XML/JSON backup, find new invoices and generate DPS (Declaração de Prestação de Serviços)
        const invoices = parseBackup(content);
        const generatedNfseRoll = generateNfseRoll(invoices);

        // 3. Upload the resulting "roll" of processed NFSe
        const processedKey = `processed/${key.split('/').pop()}-result.json`;
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: processedKey,
            Body: JSON.stringify(generatedNfseRoll),
            ContentType: 'application/json'
        }));

        // 4. Notify completion via SES
        await ses.send(new SendEmailCommand({
            Destination: { ToAddresses: ["admin@costumerental.com"] },
            Message: {
                Body: { Text: { Data: `O processamento do backup ${key} foi concluído. ${invoices.length} notas processadas.` } },
                Subject: { Data: "NFSe: Integração Concluída" }
            },
            Source: "sistema@costumerental.com"
        }));

        return { status: 'success', processedKey };
    } catch (err) {
        console.error(err);
        throw err;
    }
};

function parseBackup(content) {
    // Logic to parse the backup file based on layouts
    // Return mock for now
    return [{ id: '123', value: 100 }, { id: '124', value: 250 }];
}

function generateNfseRoll(invoices) {
    // Logic to stack invoices into NFSe DPS standard
    return invoices.map(inv => ({
        dps_standard: true,
        invoice_id: inv.id,
        status: 'GEN_ACCORDING_TO_ANEXO_IV'
    }));
}
