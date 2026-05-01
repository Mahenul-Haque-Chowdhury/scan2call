import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * On-demand ISR revalidation webhook.
 * Called by the backend API when content changes (e.g., product updates, store changes).
 *
 * Expected payload:
 * {
 *   "secret": "REVALIDATION_SECRET",
 *   "type": "path" | "tag",
 *   "value": "/store" | "products"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, type, value } = body;

    // Verify the revalidation secret
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
    }

    if (!type || !value) {
      return NextResponse.json(
        { message: 'Missing "type" (path | tag) and "value" fields' },
        { status: 400 },
      );
    }

    if (type === 'path') {
      revalidatePath(value);
    } else if (type === 'tag') {
      revalidateTag(value, 'max');
    } else {
      return NextResponse.json(
        { message: 'Invalid type. Must be "path" or "tag".' },
        { status: 400 },
      );
    }

    return NextResponse.json({ revalidated: true, type, value });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error revalidating', error: String(error) },
      { status: 500 },
    );
  }
}
