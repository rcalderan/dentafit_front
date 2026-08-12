import { readFileSync } from 'fs';
import { deserialize } from 'bson';

const files = [
  'c:/Users/richa/dev/anti/nmsystem/mongobkp/noivabd/cliente.bson',
  'c:/Users/richa/dev/anti/nmsystem/mongobkp/noivabd/contrato.bson',
  'c:/Users/richa/dev/anti/nmsystem/mongobkp/noivabd/roupa.bson',
];

files.forEach(file => {
  console.log(`\n\n====== ${file.split('/').pop()} ======`);
  try {
    const buffer = readFileSync(file);
    let offset = 0;
    let count = 0;
    
    while (offset < buffer.length && count < 3) {
      try {
        const docSize = buffer.readInt32LE(offset);
        if (docSize <= 0 || offset + docSize > buffer.length) break;
        
        const docBuffer = buffer.slice(offset, offset + docSize);
        const doc = deserialize(docBuffer);
        console.log(JSON.stringify(doc, null, 2));
        
        offset += docSize;
        count++;
      } catch (err) {
        break;
      }
    }
    
    console.log(`\nTotal records read: ${count}`);
  } catch (err) {
    console.error('Error reading file:', err.message);
  }
});
