import { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/landing/Footer";
import { CONSENT_VERSION, RETENTION_PERIOD, privacyContactEmail } from "@/lib/consent";

export const metadata: Metadata = {
  title: "Privacy Policy - Starmee",
  description: "How Starmee handles your data and protects your family's privacy.",
};

const H2 = "font-heading text-xl font-semibold text-gray-900 mb-3";
const UL = "list-disc pl-6 space-y-2";
const LINK = "text-[#7C3AED] hover:underline";

export default function PrivacyPage() {
  const contact = privacyContactEmail();
  return (
    <div className="min-h-screen bg-[#FFFBF5]">
      <Navbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:py-20">
        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-400 mb-10">
          Version {CONSENT_VERSION}
        </p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-[15px] leading-relaxed">
          <section>
            <h2 className={H2}>The short version</h2>
            <p>
              Starmee makes personalized storybooks for children. We ask for the
              small amount of information we need to write, check and deliver a
              story, and nothing more. We do not sell your information. Marketing
              email is entirely optional and off unless you tick the box.
            </p>
          </section>

          <section>
            <h2 className={H2}>What we collect</h2>
            <ul className={UL}>
              <li>
                <strong>Your email address</strong> - so we can send you the
                finished story and order updates.
              </li>
              <li>
                <strong>The name of the child the story is for</strong> - so the
                story can be personalized.
              </li>
              <li>
                <strong>Story choices</strong> - the theme, the animal or main
                character, and the short answers you give in the create wizard.
              </li>
              <li>
                <strong>Your consent choices</strong> - whether you opted in to
                marketing, your confirmation that you are an adult, and the date
                and version of the wording you agreed to.
              </li>
              <li>
                <strong>Order records</strong> - the generated story and
                illustrations, the order status, and our internal review notes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className={H2}>What we deliberately do not collect</h2>
            <p>
              We do not ask for, and you should not send us, a child&apos;s email
              address, date of birth, home address, school, location, photographs
              or any other personal detail about a child. The story only needs a
              first name and a few fun choices.
            </p>
          </section>

          <section>
            <h2 className={H2}>Why we collect it and how it is used</h2>
            <ul className={UL}>
              <li>To generate your personalized story and illustrations.</li>
              <li>
                To let a member of our team read and check the story before it is
                sent to you (see below).
              </li>
              <li>To deliver the finished story and respond if you contact us.</li>
              <li>
                To send you occasional marketing email - only if you ticked the
                optional box.
              </li>
            </ul>
            <p>
              We do not use your information to build advertising profiles, and we
              do not sell or rent it to anyone.
            </p>
          </section>

          <section>
            <h2 className={H2}>A person reads every story</h2>
            <p>
              Before any story is emailed to you, a member of the Starmee team
              reads the text and looks at the illustrations to check they are
              accurate and appropriate for children. This means a small number of
              trained people can see the child&apos;s first name and the story
              itself. Nothing is delivered automatically without that check.
            </p>
          </section>

          <section>
            <h2 className={H2}>Marketing email is separate and optional</h2>
            <p>
              The marketing checkbox is unticked by default, is never required to
              place an order, and is stored separately from the details we need to
              fulfil your order. If you tick it we record the date, time and the
              version of the wording you agreed to.
            </p>
            <p>
              You can withdraw consent at any time by clicking unsubscribe in any
              marketing email, or by emailing{" "}
              <a className={LINK} href={`mailto:${contact}`}>{contact}</a>. Withdrawing
              marketing consent does not affect emails about an order you have
              already placed.
            </p>
          </section>

          <section>
            <h2 className={H2}>Who else processes your information</h2>
            <p>
              We use a small number of service providers to run Starmee: a
              database and file storage provider, an AI provider that generates the
              story text and illustrations, our application hosting provider, and
              an email delivery provider. They process your information only to
              provide those services to us.
            </p>
          </section>

          <section>
            <h2 className={H2}>How long we keep it</h2>
            <p>
              We generally keep order information for {RETENTION_PERIOD} so you can
              re-download your book and so we can help if something goes wrong.
              After that we delete or anonymise it. If you ask us to delete your
              information sooner, we will.
            </p>
          </section>

          <section>
            <h2 className={H2}>Your choices</h2>
            <p>
              You can ask us to give you a copy of your information, correct it, or
              delete it. Email{" "}
              <a className={LINK} href={`mailto:${contact}`}>{contact}</a> and we will
              respond within a reasonable time. We may need to confirm you are the
              person who placed the order before we act.
            </p>
          </section>

          <section>
            <h2 className={H2}>Children</h2>
            <p>
              Starmee is bought by adults, for children. When you place an order you
              confirm that you are 18 or older and that you are allowed to give us
              the personalization details. Starmee accounts are not intended for
              children, and we do not knowingly collect information directly from
              children. If you believe a child has given us information, email{" "}
              <a className={LINK} href={`mailto:${contact}`}>{contact}</a> and we will
              delete it.
            </p>
          </section>

          <section>
            <h2 className={H2}>Contact us</h2>
            <p>
              For any privacy question or request, email{" "}
              <a className={LINK} href={`mailto:${contact}`}>{contact}</a>. You can also
              reach us through our <Link className={LINK} href="/contact">contact page</Link>.
            </p>
          </section>

          <section>
            <h2 className={H2}>Changes to this policy</h2>
            <p>
              If we change this policy we will update the version number at the top
              of this page. This policy describes our current practices in plain
              language; it is not legal advice, and it is not a claim of
              certification under any particular law.
            </p>
          </section>

        </div>
      </main>
      <Footer />
    </div>
  );
}
