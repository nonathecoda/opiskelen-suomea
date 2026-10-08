import { get } from "@vercel/blob";
import { cookies } from "next/headers";
import { BOOK_PHOTOS } from "@/lib/bookPages";
import { PAGES_COOKIE, unlocked } from "@/lib/pagesAuth";

/** One photo of a book page, from the private store, for a browser that has given the password. */
export async function GET(_request: Request, context: RouteContext<"/api/pages/[name]">) {
  const jar = await cookies();
  if (!unlocked(jar.get(PAGES_COOKIE)?.value)) return new Response(null, { status: 401 });

  const { name } = await context.params;
  if (!BOOK_PHOTOS.some((photo) => photo.id === name)) return new Response(null, { status: 404 });

  const photo = await get(`pages/${name}.jpg`, { access: "private", token: process.env.BLOB_READ_WRITE_TOKEN });
  if (photo?.statusCode !== 200) return new Response(null, { status: 404 });

  return new Response(photo.stream, {
    headers: {
      "Content-Type": "image/jpeg",
      // A photo never changes, and must not be kept by anything shared between people.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
