const { BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
let QRCode = null;
try {
  // Dependencia para generar QR localmente (sin llamadas externas)
  QRCode = require('qrcode');
} catch (_error) {
  QRCode = null;
}

const TEMPLATES = {
  '65': {
    key: '65',
    name: '65 etiquetas por hoja (38.1 x 21.2 mm)',
    columns: 5,
    rows: 13,
    labelWidthMm: 38.1,
    labelHeightMm: 21.2,
    signatureFontMm: 2.8,
    codeFontMm: 2.1,
  },
  '24': {
    key: '24',
    name: '24 etiquetas por hoja (63.5 x 33.9 mm)',
    columns: 3,
    rows: 8,
    labelWidthMm: 63.5,
    labelHeightMm: 33.9,
    signatureFontMm: 4.2,
    codeFontMm: 2.6,
  },
  '21': {
    key: '21',
    name: '21 etiquetas por hoja (63.5 x 38.1 mm)',
    columns: 3,
    rows: 7,
    labelWidthMm: 63.5,
    labelHeightMm: 38.1,
    signatureFontMm: 4.6,
    codeFontMm: 2.8,
  },
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function qrCodeDataUrl(signature) {
  if (!QRCode) {
    throw new Error('Falta dependencia "qrcode". Ejecuta bun install o npm install.');
  }
  const payload = String(signature || '').trim();
  if (!payload) return '';
  return QRCode.toDataURL(payload, {
    width: 240,
    margin: 0,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });
}

async function buildHtml(books, template) {
  const booksWithQr = await Promise.all(
    books.map(async (book) => ({
      ...book,
      qrDataUrl: await qrCodeDataUrl(book.signature),
    }))
  );

  const perPage = template.columns * template.rows;
  const pages = [];
  for (let i = 0; i < booksWithQr.length; i += perPage) {
    pages.push(booksWithQr.slice(i, i + perPage));
  }

  const pageHtml = pages
    .map((pageBooks) => {
      const labels = pageBooks
        .map((book) => {
          const signature = String(book.signature || '').trim();
          return `
            <div class="label">
              <div class="signature">${escapeHtml(signature || 'SIN SIGNATURA')}</div>
              <div class="qr">
                ${book.qrDataUrl ? `<img src="${book.qrDataUrl}" alt="QR de ${escapeHtml(signature)}" loading="eager">` : ''}
              </div>
              <div class="code">${escapeHtml(signature || '')}</div>
            </div>
          `;
        })
        .join('');
      return `<section class="page">${labels}</section>`;
    })
    .join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>Impresión de tejuelos</title>
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; color: #000; }
    .page {
      width: 210mm;
      height: 297mm;
      display: grid;
      grid-template-columns: repeat(${template.columns}, ${template.labelWidthMm}mm);
      grid-template-rows: repeat(${template.rows}, ${template.labelHeightMm}mm);
      justify-content: center;
      align-content: center;
      page-break-after: always;
    }
    .page:last-child { page-break-after: auto; }
    .label {
      padding: 1.6mm 1.8mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow: hidden;
    }
    .signature {
      font-size: ${template.signatureFontMm}mm;
      line-height: 1.05;
      font-weight: 700;
      text-align: center;
      word-break: break-word;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }
    .qr {
      width: ${Math.max(8.2, template.labelHeightMm * 0.62)}mm;
      height: ${Math.max(8.2, template.labelHeightMm * 0.62)}mm;
      margin: 0 auto;
    }
    .qr img {
      width: 100%;
      height: 100%;
      display: block;
      object-fit: contain;
    }
    .code {
      font-size: ${template.codeFontMm}mm;
      text-align: center;
      letter-spacing: 0.04em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  </style>
</head>
<body>
  ${pageHtml}
</body>
</html>`;
}

async function createPrintWindow(html) {
  const win = new BrowserWindow({
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      sandbox: true,
      javascript: true,
    },
  });
  const dataUrl = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  await win.loadURL(dataUrl);
  return win;
}

async function waitForQrImages(win, timeoutMs = 10000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    // eslint-disable-next-line no-await-in-loop
    const ready = await win.webContents.executeJavaScript(
      `(() => {
        const imgs = Array.from(document.images || []);
        if (imgs.length === 0) return true;
        return imgs.every((img) => img.complete && img.naturalWidth > 0);
      })();`,
      true
    );
    if (ready) return;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, 120));
  }
}

async function printLabels(input = {}) {
  const books = Array.isArray(input.books) ? input.books : [];
  const template = TEMPLATES[String(input.template || '65')] || TEMPLATES['65'];
  const output = input.output === 'printer' ? 'printer' : 'pdf';

  const printable = books
    .map((book) => ({
      id: Number(book.id),
      signature: String(book.signature || '').trim(),
    }))
    .filter((book) => Number.isFinite(book.id) && book.id > 0 && book.signature);

  if (printable.length === 0) {
    throw new Error('No hay libros con signatura para imprimir');
  }

  const html = await buildHtml(printable, template);
  const win = await createPrintWindow(html);
  await waitForQrImages(win);

  try {
    if (output === 'printer') {
      const result = await new Promise((resolve, reject) => {
        win.webContents.print(
          { silent: false, printBackground: true, pageSize: 'A4' },
          (success, errorType) => {
            if (!success) {
              reject(new Error(errorType || 'No se pudo enviar a la impresora'));
              return;
            }
            resolve({ success: true });
          }
        );
      });

      return {
        mode: 'printer',
        printed: true,
        count: printable.length,
        template: template.key,
        ...result,
      };
    }

    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'none' },
    });

    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const defaultPath = path.join(process.cwd(), `tejuelos-${stamp}.pdf`);
    const selected = await dialog.showSaveDialog(win, {
      title: 'Guardar PDF de tejuelos',
      defaultPath,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });

    if (selected.canceled || !selected.filePath) {
      return {
        mode: 'pdf',
        saved: false,
        count: printable.length,
        template: template.key,
      };
    }

    fs.writeFileSync(selected.filePath, pdf);
    return {
      mode: 'pdf',
      saved: true,
      path: selected.filePath,
      count: printable.length,
      template: template.key,
    };
  } finally {
    if (!win.isDestroyed()) {
      win.close();
    }
  }
}

module.exports = {
  printLabels,
  TEMPLATES,
};
