const { MultiFormatReader, BinaryBitmap, HybridBinarizer, RGBLuminanceSource, BarcodeFormat, DecodeHintType } = require('@zxing/library');
const { createCanvas, loadImage } = require('canvas');

async function scanImage(imagePath) {
  try {
    const image = await loadImage(imagePath);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0, image.width, image.height);
    
    const imageData = ctx.getImageData(0, 0, image.width, image.height);
    const luminanceSource = new RGBLuminanceSource(imageData.data, image.width, image.height);
    const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
    
    const hints = new Map();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.PDF_417]);
    
    const reader = new MultiFormatReader();
    const result = reader.decode(binaryBitmap, hints);
    console.log("EXITO:", result.getText());
  } catch (err) {
    console.error("ERROR LEYENDO:", err.message);
  }
}

scanImage('/Users/gian.social/Downloads/IMG_8349.jpg');
