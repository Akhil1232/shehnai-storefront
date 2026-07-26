import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { toggleReview, deleteReview } from "../actions";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  await requireAdmin();
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true } } },
    take: 200,
  });

  return (
    <>
      <h1 className="mb-1 font-serif text-3xl">Reviews</h1>
      <p className="mb-5 text-[13px] text-[color:var(--muted)]">
        <b>Published</b> shows on the product page. <b>Featured</b> also shows in the homepage rail.
      </p>

      <div className="overflow-x-auto rounded border border-[color:var(--line)] bg-white">
        <table className="w-full text-[13px]">
          <thead className="border-b border-[color:var(--line)] bg-[#FAF7F0] text-left">
            <tr className="[&>th]:px-3 [&>th]:py-2 [&>th]:text-[10.5px] [&>th]:font-bold [&>th]:uppercase [&>th]:tracking-[0.1em]">
              <th>Reviewer</th><th>Product</th><th>Rating</th><th>Review</th><th>Published</th><th>Featured</th><th></th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.id} className="border-b border-[color:var(--line)] last:border-0 align-top">
                <td className="px-3 py-2">{r.name}<span className="block text-[11px] text-[color:var(--muted)]">{r.city}</span></td>
                <td className="px-3 py-2 text-[color:var(--muted)]">{r.product?.name ?? "—"}</td>
                <td className="px-3 py-2 text-gold">{"★".repeat(r.rating)}</td>
                <td className="max-w-[320px] px-3 py-2">
                  {r.title && <b className="block">{r.title}</b>}
                  <span className="text-[color:var(--muted)]">{r.body}</span>
                </td>
                {(["isPublished", "isFeatured"] as const).map((field) => (
                  <td key={field} className="px-3 py-2">
                    <form action={toggleReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <input type="hidden" name="field" value={field} />
                      <button className={`rounded px-2 py-1 text-[11px] font-bold ${r[field] ? "bg-green-100 text-green-800" : "bg-neutral-200 text-neutral-600"}`}>
                        {r[field] ? "Yes" : "No"}
                      </button>
                    </form>
                  </td>
                ))}
                <td className="px-3 py-2">
                  <form action={deleteReview}>
                    <input type="hidden" name="id" value={r.id} />
                    <button className="text-[11px] text-red-700">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {reviews.length === 0 && <p className="p-6 text-center text-[13px] text-[color:var(--muted)]">No reviews yet.</p>}
      </div>
    </>
  );
}
