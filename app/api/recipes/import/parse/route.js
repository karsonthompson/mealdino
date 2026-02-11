import { auth } from '@/auth';
import { parseRecipeImportInputSmart } from '@/lib/recipeImport';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_EXTRACTED_TEXT_CHARS = 500_000;
const PDF_PAGE_LIMIT = 80;

function truncateExtractedText(value) {
  const text = String(value || '');
  if (text.length <= MAX_EXTRACTED_TEXT_CHARS) {
    return { text, truncated: false };
  }

  return {
    text: text.slice(0, MAX_EXTRACTED_TEXT_CHARS),
    truncated: true
  };
}

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Dynamic import avoids loading pdf parser for non-PDF uploads.
  const pdfParseModule = await import('pdf-parse');
  const parsePdf = pdfParseModule.default || pdfParseModule;
  const result = await parsePdf(buffer, { max: PDF_PAGE_LIMIT });
  const { text, truncated } = truncateExtractedText(result?.text || '');
  return { text, truncated };
}

export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') || '';
    let text = '';
    let fileName = '';
    let mimeType = '';
    let extractionWarning = '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      const pastedText = formData.get('text');

      if (typeof pastedText === 'string' && pastedText.trim()) {
        text = pastedText;
      }

      if (file && typeof file === 'object' && 'text' in file) {
        fileName = file.name || '';
        mimeType = file.type || '';

        if (typeof file.size === 'number' && file.size > MAX_UPLOAD_BYTES) {
          return Response.json(
            {
              success: false,
              message: 'Uploaded file is too large for this hosted parser. Keep files under ~4MB, split the PDF, or paste recipe text.'
            },
            { status: 413 }
          );
        }

        if (!text) {
          const isPdf = fileName.toLowerCase().endsWith('.pdf') || mimeType.toLowerCase().includes('pdf');
          if (isPdf) {
            try {
              const extracted = await extractPdfText(file);
              text = extracted.text;
              if (extracted.truncated) {
                extractionWarning = 'PDF text was truncated for performance. Parse results may include only part of the document.';
              }
            } catch (error) {
              console.error('PDF extraction failed:', error);
              return Response.json({
                success: true,
                data: {
                  drafts: [],
                  warnings: ['Could not extract text from this PDF. Try a different PDF or paste the recipe text manually.'],
                  count: 0
                }
              });
            }
          } else {
            text = await file.text();
          }
        }
      }
    } else if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
      const blob = await request.blob();
      fileName = 'upload.pdf';
      mimeType = blob.type || contentType;

      if (blob.size > MAX_UPLOAD_BYTES) {
        return Response.json(
          {
            success: false,
            message: 'Uploaded file is too large for this hosted parser. Keep files under ~4MB, split the PDF, or paste recipe text.'
          },
          { status: 413 }
        );
      }

      const extracted = await extractPdfText(blob);
      text = extracted.text;
      if (extracted.truncated) {
        extractionWarning = 'PDF text was truncated for performance. Parse results may include only part of the document.';
      }
    } else {
      if (contentType.includes('application/json')) {
        const cloned = request.clone();
        try {
          const body = await request.json();
          text = String(body?.text || '');
          fileName = String(body?.fileName || '');
          mimeType = String(body?.mimeType || '');
        } catch (error) {
          text = await cloned.text();
          extractionWarning = 'Request body was not valid JSON. Parsed the body as plain text.';
        }
      } else {
        text = await request.text();
      }
    }

    const { drafts, warnings } = await parseRecipeImportInputSmart({ text, fileName, mimeType });

    return Response.json({
      success: true,
      data: {
        drafts,
        warnings: extractionWarning ? [...warnings, extractionWarning] : warnings,
        count: drafts.length
      }
    });
  } catch (error) {
    console.error('Error parsing imported recipes:', error);
    return Response.json({ success: false, message: 'Failed to parse import content' }, { status: 500 });
  }
}
