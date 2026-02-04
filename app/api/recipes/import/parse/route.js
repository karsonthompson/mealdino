import { auth } from '@/auth';
import { parseRecipeImportInput } from '@/lib/recipeImport';

async function extractPdfText(file) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Dynamic import avoids loading pdf parser for non-PDF uploads.
  const pdfParseModule = await import('pdf-parse');
  const parsePdf = pdfParseModule.default || pdfParseModule;
  const result = await parsePdf(buffer);
  return String(result?.text || '');
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

        if (!text) {
          const isPdf = fileName.toLowerCase().endsWith('.pdf') || mimeType.toLowerCase().includes('pdf');
          if (isPdf) {
            try {
              text = await extractPdfText(file);
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
    } else {
      const body = await request.json();
      text = String(body?.text || '');
      fileName = String(body?.fileName || '');
      mimeType = String(body?.mimeType || '');
    }

    const { drafts, warnings } = parseRecipeImportInput({ text, fileName, mimeType });

    return Response.json({
      success: true,
      data: {
        drafts,
        warnings,
        count: drafts.length
      }
    });
  } catch (error) {
    console.error('Error parsing imported recipes:', error);
    return Response.json({ success: false, message: 'Failed to parse import content' }, { status: 500 });
  }
}
