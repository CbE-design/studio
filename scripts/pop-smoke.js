const fs = require('fs');
const path = require('path');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

async function wrapTextLines(text, maxWidth, font, fontSize) {
  const paragraphs = text.split('\n');
  const lines = [];
  for (let p = 0; p < paragraphs.length; p++) {
    const words = paragraphs[p].split(' ');
    if (words.length === 0) {
      lines.push('');
      continue;
    }
    let currentLine = words[0] || '';
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      if (!word) continue;
      const width = font.widthOfTextAtSize(currentLine + ' ' + word, fontSize);
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    if (p < paragraphs.length - 1) lines.push('');
  }
  return lines;
}

async function run() {
  const outPath = path.join(__dirname, 'pop-smoke-output.pdf');
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const margin = 50;
  let y = height - margin;

  const paragraph = `This notification of payment is sent to you by Nedbank Limited Reg No 1951/000009/06. Enquiries regarding this payment notification\nshould be directed to the Nedbank Contact Centre on 0860 555 111.\nPlease contact the payer for enquiries regarding the contents of this notification. Nedbank Ltd will not be held responsible for the accuracy of\nthe information on this notification and we accept no liability whatsoever arising from the transmission and use of the information`;

  const lines = await wrapTextLines(paragraph, width - margin * 2, font, 9);
  const lineHeight = 12;
  for (const line of lines) {
    page.drawText(line, { x: margin, y, font, size: 9, color: rgb(0,0,0) });
    y -= lineHeight;
  }

  // Add a small marker so we can confirm file content visually
  page.drawText('--- end of smoke text ---', { x: margin, y: 80, font, size: 8, color: rgb(0.3,0.3,0.3) });

  const bytes = await pdfDoc.save();
  fs.writeFileSync(outPath, bytes);
  console.log('Wrote', outPath);
}

run().catch(err => { console.error(err); process.exit(1); });
