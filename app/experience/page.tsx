import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRightIcon, CrosshairIcon, CalendarIcon, ZapIcon } from "lucide-react"
import MachineCard from "@/components/MachineCard"

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Discover what VR hunting at VRZ feels like. 6 independent machines, fully immersive environments, and sessions from 15 minutes to 2 hours.",
}

const howItWorks = [
  {
    step: "01",
    icon: CalendarIcon,
    title: "Choose",
    desc: "Pick your date, session type, machine, and duration through our booking flow.",
  },
  {
    step: "02",
    icon: CrosshairIcon,
    title: "Book",
    desc: "Confirm your details and lock in your slot. Your machine will be ready when you arrive.",
  },
  {
    step: "03",
    icon: ZapIcon,
    title: "Hunt",
    desc: "Gear up, step in, and let instinct take over. The virtual world doesn't forgive hesitation.",
  },
]

const testimonials = [
  {
    quote:
      "Genuinely the most intense VR experience I've had. The machines are top-tier and the space feels designed for focus.",
    name: "Rania K.",
    tag: "Regular visitor",
  },
  {
    quote:
      "We rented the full space for a birthday and it was perfect. Six people, zero mercy. Highly recommend the private option.",
    name: "Marc T.",
    tag: "Private session",
  },
  {
    quote:
      "The 60-minute single session is the sweet spot. Long enough to get immersed, competitive enough to want a rematch.",
    name: "Jad B.",
    tag: "Single session",
  },
]

export default function ExperiencePage() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_50%_0%,#00FF7F08,transparent)]" />
        <div className="mx-auto max-w-3xl text-center relative z-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-6 block">
            The Experience
          </span>
          <h1
            className="font-heading text-5xl sm:text-8xl text-white leading-none mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            VR Hunting
          </h1>
          <p className="text-zinc-400 text-lg leading-relaxed max-w-xl mx-auto">
            VR hunting at VRZ isn&apos;t a game. It&apos;s a simulation built
            for people who want to feel what&apos;s at stake — with no real
            risk and all of the adrenaline.
          </p>
        </div>
      </section>

      {/* ── What is VR Hunting ───────────────────────────────── */}
      <section className="py-16 px-4 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
            <div>
              <h2
                className="font-heading text-4xl sm:text-5xl text-white mb-5"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                What Is VR Hunting?
              </h2>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  Virtual reality hunting places you inside photo-realistic
                  environments — dense forests, open fields, mountain terrain —
                  with complete spatial audio and 360° vision. You track, aim,
                  and react as if you&apos;re really there.
                </p>
                <p>
                  At VRZ, each of our six stations is equipped with
                  high-refresh-rate headsets and motion-tracked controllers.
                  The experience is physical, precise, and deeply engaging.
                </p>
                <p>
                  Whether you&apos;re a first-timer or a seasoned player, the
                  simulation adapts to your pace. There&apos;s no tutorial that
                  prepares you for the real thing.
                </p>
              </div>
              <Link
                href="/book"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-vrz-green px-6 py-3 text-sm font-bold text-black hover:bg-vrz-green/90 transition-all"
              >
                Book a Session
                <ArrowRightIcon className="size-4" />
              </Link>
            </div>

            {/* Visual block */}
            <div className="relative rounded-xl border border-white/10 bg-gradient-to-br from-vrz-green/5 to-transparent p-8 flex flex-col gap-4 noise-overlay min-h-[280px]">
              <div className="absolute top-4 right-4 text-xs uppercase tracking-widest text-vrz-green/60">
                Live
              </div>
              <div
                className="font-heading text-7xl text-white/10"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                6
              </div>
              <p className="text-zinc-400 text-sm">Machines running</p>
              <div className="mt-auto grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="flex items-center justify-center rounded-lg border border-vrz-green/20 bg-vrz-green/5 py-2 text-xs font-mono text-vrz-green"
                  >
                    #{n}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Machine Showcase ─────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-b from-transparent via-vrz-green/[0.02] to-transparent border-t border-white/5">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">
              The Machines
            </span>
            <h2
              className="font-heading text-4xl sm:text-6xl text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              6 Independent Stations
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <MachineCard key={n} number={n} available={true} />
            ))}
          </div>

          <p className="text-center text-sm text-zinc-600 mt-6">
            Each machine operates independently — book one or all six.
          </p>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">
              The Process
            </span>
            <h2
              className="font-heading text-4xl sm:text-6xl text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              How It Works
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {howItWorks.map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="relative flex flex-col gap-5 rounded-xl border border-white/8 bg-white/2 p-6 hover:border-vrz-green/20 transition-colors group">
                <span
                  className="font-heading text-6xl text-white/5 absolute top-4 right-4 group-hover:text-vrz-green/10 transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {step}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/3 group-hover:border-vrz-green/30 transition-colors">
                  <Icon className="size-5 text-zinc-400 group-hover:text-vrz-green transition-colors" />
                </div>
                <div>
                  <h3
                    className="font-heading text-2xl text-white mb-2"
                    style={{ fontFamily: "var(--font-heading)" }}
                  >
                    {title}
                  </h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────── */}
      <section className="py-24 px-4 border-t border-white/5">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">
              Voices from the Field
            </span>
            <h2
              className="font-heading text-4xl sm:text-5xl text-white"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              What Hunters Say
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {testimonials.map(({ quote, name, tag }) => (
              <div key={name} className="flex flex-col gap-4 rounded-xl border border-white/8 bg-white/2 p-6">
                <p className="text-sm text-zinc-300 leading-relaxed italic">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="mt-auto pt-4 border-t border-white/5">
                  <p className="text-sm font-medium text-white">{name}</p>
                  <p className="text-xs text-vrz-green/70">{tag}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 border-t border-white/5">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="font-heading text-4xl sm:text-6xl text-white mb-6"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Your Machine is Waiting
          </h2>
          <Link
            href="/book"
            className="inline-flex items-center gap-2 rounded-lg bg-vrz-green px-10 py-4 text-sm font-bold text-black hover:bg-vrz-green/90 transition-all hover:scale-105"
          >
            Reserve Now
            <ArrowRightIcon className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
