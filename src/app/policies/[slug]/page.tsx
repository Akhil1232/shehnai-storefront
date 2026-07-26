import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Rule from "@/components/ui/Rule";
import { getSettings } from "@/lib/settings";

export const revalidate = 3600;

/**
 * Policy pages. Razorpay requires shipping, refund/return, privacy and terms
 * pages to be live on the domain before they will activate an account, so these
 * are not optional decoration.
 *
 * To edit: change the text below. If you'd rather the client edited these
 * without a deploy, move `POLICIES` into the Setting table and read it through
 * lib/settings.ts — the shape is already JSON-friendly.
 */
type Section = { heading: string; body: string[] };
type Policy = { title: string; intro: string; sections: Section[] };

const POLICIES: Record<string, Policy> = {
  shipping: {
    title: "Shipping Policy",
    intro:
      "Every piece is checked by hand before it is packed. Here is exactly what to expect once you place an order.",
    sections: [
      {
        heading: "Dispatch time",
        body: [
          "Orders are dispatched within 2–3 working days of payment confirmation. Sundays and public holidays are not counted as working days.",
          "During wedding season and major festivals, dispatch may take an additional day. If we expect a delay beyond this, we will contact you on the phone number provided with your order.",
        ],
      },
      {
        heading: "Delivery time",
        body: [
          "Once dispatched, delivery typically takes 3–7 working days depending on your PIN code. Metro cities are usually at the faster end of that range.",
          "You will receive the courier name and tracking number by email as soon as the parcel is handed over.",
        ],
      },
      {
        heading: "Shipping charges",
        body: [
          "Shipping is free on orders above the threshold shown at checkout. Below it, a flat shipping charge applies and is displayed before you pay.",
          "Cash on Delivery is available on most PIN codes. If your PIN code is not serviceable for COD, the option will not appear at checkout.",
        ],
      },
      {
        heading: "Incorrect addresses",
        body: [
          "Please check your address and PIN code carefully before paying. Once a parcel has been dispatched we cannot change the delivery address.",
          "If a parcel is returned to us because the address was incomplete or nobody was available to receive it, re-dispatch will be charged again.",
        ],
      },
    ],
  },

  returns: {
    title: "Replacement Policy",
    intro:
      "Please read this before ordering. We offer replacements only — we do not offer returns or refunds — and a clear unboxing video is required.",
    sections: [
      {
        heading: "What we replace",
        body: [
          "We replace an item if it reaches you damaged, if the wrong item was sent, or if part of your order is missing from the parcel.",
          "A replacement is sent for the same item. We do not offer refunds, store credit, or exchanges for a different product.",
        ],
      },
      {
        heading: "The unboxing video is mandatory",
        body: [
          "A continuous, unedited video of the parcel being opened is required for every replacement claim. Without it we are unable to process the request — this is the only way we can tell a transit issue apart from later damage, and it is what allows us to claim against the courier.",
          "The video must start before the packaging is cut or torn, show the sealed parcel and the shipping label clearly, and continue without pause until the item is fully unwrapped and visible.",
          "Please do not stop and restart the recording. A video that begins with the parcel already open cannot be accepted.",
        ],
      },
      {
        heading: "How to raise a claim",
        body: [
          "Write to us within 48 hours of delivery with your order number and the unboxing video attached, or share it on WhatsApp using the number in the footer.",
          "We respond within 2 working days. If the claim is approved, the replacement is dispatched at our cost and you do not pay shipping again.",
        ],
      },
      {
        heading: "What is not covered",
        body: [
          "Change of mind, a piece not suiting your outfit, or ordering the wrong item are not covered.",
          "Normal variation in handwork — small differences in stone placement, plating tone or finish between two pieces of the same design — is a characteristic of hand-finished jewellery and is not a defect.",
          "Damage from wear, moisture, perfume or storage after delivery is not covered.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    intro: "What we collect, why we collect it, and what we never do with it.",
    sections: [
      {
        heading: "What we collect",
        body: [
          "Your name, email address, phone number and delivery address — used solely to process and deliver your order and to contact you about it.",
          "We do not see, receive or store your card, UPI or bank details. Payments are handled entirely by Razorpay, a PCI-DSS compliant payment gateway.",
        ],
      },
      {
        heading: "Who we share it with",
        body: [
          "Only our courier partners, and only the details needed to deliver your parcel.",
          "We do not sell, rent or trade your information to anyone, for any purpose.",
        ],
      },
      {
        heading: "Your choices",
        body: [
          "Newsletter emails can be unsubscribed from at any time using the link in any email we send.",
          "To have your account details removed from our records, write to us at the support email in the footer.",
        ],
      },
    ],
  },

  terms: {
    title: "Terms & Conditions",
    intro: "The terms you agree to when you place an order with us.",
    sections: [
      {
        heading: "Products",
        body: [
          "Our jewellery is fashion jewellery in brass, alloy, kundan, glass stones and faux pearl. It is not precious metal and is not sold by gold or silver weight.",
          "Photographs are taken under studio lighting. Screen calibration varies, so slight differences in colour between the photograph and the piece are normal.",
        ],
      },
      {
        heading: "Pricing and orders",
        body: [
          "All prices are in Indian Rupees and inclusive of applicable taxes. The final amount is recalculated on our server before you are charged.",
          "We may cancel an order and refund the amount paid if an item is found to be out of stock or if pricing was displayed in error.",
        ],
      },
      {
        heading: "Care",
        body: [
          "Keep pieces away from water, perfume, deodorant and humidity. Wipe with a dry cloth and store in the pouch provided.",
          "Plated finishes will change over time with wear. This is expected and is not covered by the replacement policy.",
        ],
      },
    ],
  },
};

export function generateStaticParams() {
  return Object.keys(POLICIES).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICIES[slug];
  return policy ? { title: policy.title, description: policy.intro } : {};
}

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = POLICIES[slug];
  if (!policy) notFound();

  const settings = await getSettings();

  return (
    <article className="wrap max-w-[720px] py-12 sm:py-16">
      <header className="text-center">
        <span className="eyebrow text-maroon">Shehnai®</span>
        <h1 className="my-2 text-[28px] sm:text-[clamp(30px,4vw,42px)]">{policy.title}</h1>
        <Rule className="mb-6" />
        <p className="mx-auto max-w-[52ch] text-[14px] text-[color:var(--muted)]">{policy.intro}</p>
      </header>

      {policy.sections.map((section) => (
        <section key={section.heading} className="mt-9">
          <h2 className="mb-2.5 font-serif text-[21px]">{section.heading}</h2>
          {section.body.map((para, i) => (
            <p key={i} className="mb-3 text-[14.5px] leading-relaxed text-[color:var(--muted)]">
              {para}
            </p>
          ))}
        </section>
      ))}

      <footer className="mt-12 rounded-[2px] border border-[color:var(--line-gold)] bg-paper p-5 text-center">
        <p className="text-[13.5px] text-[color:var(--muted)]">
          Questions about this policy? Write to{" "}
          <a href={`mailto:${settings.supportEmail}`} className="font-semibold text-maroon">
            {settings.supportEmail}
          </a>{" "}
          or message us on{" "}
          <a href={settings.whatsapp} className="font-semibold text-maroon">WhatsApp</a>.
        </p>
      </footer>
    </article>
  );
}
