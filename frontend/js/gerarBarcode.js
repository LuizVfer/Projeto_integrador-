import JsBarcode from 'https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/+esm';

// Função para validar o checksum EAN-13
function isValidEAN13(barcode) {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checksum = digits.pop();
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += digits[i] * (i % 2 === 0 ? 1 : 3);
  }
  const calculatedChecksum = (10 - (sum % 10)) % 10;
  return checksum === calculatedChecksum;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.barcode-canvas').forEach(canvas => {
    const barcodeValue = canvas.dataset.barcode;
    if (barcodeValue && isValidEAN13(barcodeValue)) {
      try {
        JsBarcode(canvas, barcodeValue, {
          format: 'EAN13',
          lineColor: '#000',
          width: 2,
          height: 50,
          displayValue: true,
        });
      } catch (err) {
        console.error(`Erro ao gerar código de barras para ${barcodeValue}:`, err);
        canvas.replaceWith(document.createTextNode('Código de barras inválido'));
      }
    } else {
      canvas.replaceWith(document.createTextNode('Sem código de barras'));
    }
  });
});