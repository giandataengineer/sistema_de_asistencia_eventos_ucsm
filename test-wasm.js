const { readBarcodesFromImageFile } = require('zxing-wasm/node');

async function scan() {
  try {
    const fs = require('fs');
    const buffer = fs.readFileSync('/Users/gian.social/Downloads/IMG_8349.jpg');
    const blob = new Blob([buffer]);
    const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
    
    // Zxing-wasm reader
    const readerOptions = {
      tryHarder: true,
      formats: ['PDF_417'],
    };
    
    const results = await readBarcodesFromImageFile(file, readerOptions);
    console.log("ZXING-WASM SUCCESS:", results[0].text);
  } catch (err) {
    console.error("ZXING-WASM ERROR:", err.message);
  }
}

scan();
