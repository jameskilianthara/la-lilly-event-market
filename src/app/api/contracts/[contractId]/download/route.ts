import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;

    // Fetch contract to get the pdf_url
    const { data: contract, error } = await supabase
      .from('contracts')
      .select('id, pdf_url, client_id, vendor_id')
      .eq('id', contractId)
      .single();

    if (error || !contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    if (!contract.pdf_url) {
      return NextResponse.json({ error: 'No PDF available for this contract' }, { status: 404 });
    }

    // Extract the file path from the pdf_url
    // pdf_url format: https://<project>.supabase.co/storage/v1/object/public/documents/contracts/contract_xxx.pdf
    // OR: https://<project>.supabase.co/storage/v1/object/sign/documents/contracts/contract_xxx.pdf
    const url = new URL(contract.pdf_url);
    const pathParts = url.pathname.split('/storage/v1/object/');

    let filePath: string;
    if (pathParts.length > 1) {
      // Remove "public/documents/" or "sign/documents/" prefix to get just the file path
      const afterObject = pathParts[1];
      const bucketAndPath = afterObject.replace(/^(public|sign)\/documents\//, '');
      filePath = bucketAndPath;
    } else {
      return NextResponse.json({ error: 'Invalid PDF URL format' }, { status: 400 });
    }

    // Generate a signed URL valid for 60 minutes
    const { data: signedData, error: signError } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (signError || !signedData?.signedUrl) {
      console.error('Signed URL error:', signError);
      // Fallback: redirect to the original URL
      return NextResponse.redirect(contract.pdf_url);
    }

    return NextResponse.json({ signedUrl: signedData.signedUrl });
  } catch (error) {
    console.error('Download route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
