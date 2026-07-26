import { redirect } from "next/navigation";
import { authenticate, createSession } from "@/lib/auth";
import { SubmitButton } from "@/components/admin/ui";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;

  async function signIn(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const next = String(formData.get("next") ?? "/admin");

    const user = await authenticate(email, password);
    if (user === null) {
      // Deliberately vague: never reveal whether the email exists.
      redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
      return;
    }
    await createSession(user);
    redirect(next);
  }

  return (
    <div className="grid min-h-screen place-items-center p-6">
      <form action={signIn} className="w-full max-w-[360px] rounded border border-[color:var(--line)] bg-white p-7">
        <span className="font-serif text-2xl">Shehnai®</span>
        <p className="mb-6 text-[11px] uppercase tracking-[0.16em] text-[color:var(--muted)]">Admin sign in</p>

        {sp.error && (
          <p className="mb-4 rounded bg-red-50 px-3 py-2 text-[12.5px] text-red-800">
            Incorrect email or password.
          </p>
        )}

        <input type="hidden" name="next" value={sp.next ?? "/admin"} />
        <label className="mb-3 block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em]">Email</span>
          <input name="email" type="email" required autoFocus className="w-full rounded border border-[color:var(--line)] px-3 py-2 text-[13.5px]" />
        </label>
        <label className="mb-5 block">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-[0.1em]">Password</span>
          <input name="password" type="password" required className="w-full rounded border border-[color:var(--line)] px-3 py-2 text-[13.5px]" />
        </label>
        <SubmitButton>Sign in</SubmitButton>
      </form>
    </div>
  );
}
