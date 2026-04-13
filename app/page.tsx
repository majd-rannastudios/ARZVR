"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowRightIcon,
  ZapIcon,
  SwordsIcon,
  MonitorIcon,
  MapPinIcon,
  ClockIcon,
  MessageCircleIcon,
  MailIcon,
  PhoneIcon,
  CheckIcon,
  StarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react"
import ARZLogo from "@/components/ARZLogo"
import PricingCard from "@/components/PricingCard"
import BookingSection from "@/components/BookingSection"

// ── Data ─────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: ZapIcon,
    title: "The Experience",
    desc: "Step into photo-realistic VR environments — dense forests, open terrain, mountain landscapes. Full spatial audio, 360° vision, physical motion tracking.",
    stat: "Full immersion",
  },
  {
    icon: MonitorIcon,
    title: "The Machines",
    desc: "Six high-spec, independently operated VR stations. Book one, two, or take over the entire lounge for a private experience.",
    stat: "6 stations",
  },
  {
    icon: SwordsIcon,
    title: "The Hunt",
    desc: "Track, aim, and eliminate. Every session is a mission. The virtual world doesn't forgive hesitation — and neither do we.",
    stat: "Pure adrenaline",
  },
]

const testimonials = [
  {
    quote: "Genuinely the most intense VR experience I've had. The machines are top-tier and the space is designed for focus.",
    name: "Rania K.",
    tag: "Regular visitor",
    stars: 5,
  },
  {
    quote: "We rented the full space for a birthday. Six people, zero mercy. Highly recommend the private option.",
    name: "Marc T.",
    tag: "Private session",
    stars: 5,
  },
  {
    quote: "The 60-minute session is the sweet spot — long enough to get immersed, competitive enough to want a rematch.",
    name: "Jad B.",
    tag: "Single session",
    stars: 5,
  },
  {
    quote: "Nothing like it in Lebanon. The whole setup feels premium. We're coming back every weekend.",
    name: "Nour A.",
    tag: "Group booking",
    stars: 5,
  },
  {
    quote: "Booked 3 machines for a team outing. Easy to book, incredible to experience. 10/10.",
    name: "Karim M.",
    tag: "Corporate group",
    stars: 5,
  },
  {
    quote: "The immersion is unreal. I forgot I was in Byblos for a full hour. Exactly what I needed.",
    name: "Sara H.",
    tag: "Solo session",
    stars: 5,
  },
]

const stats = [
  { value: "6", label: "VR Stations" },
  { value: "8h", label: "Daily Operation" },
  { value: "15–120", label: "Min Per Session" },
  { value: "∞", label: "Replays Wanted" },
]

// Duplicated for seamless infinite loop
const CAROUSEL_ITEMS = [...testimonials, ...testimonials]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  const [weekendMode, setWeekendMode] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const userActive = useRef(false)
  const rafRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    const el = carouselRef.current
    if (!el) return

    function animate() {
      if (!userActive.current && el) {
        el.scrollLeft += 0.6
        // Seamless reset: when past first copy, jump back by exactly half
        if (el.scrollLeft >= el.scrollWidth / 2) {
          el.scrollLeft -= el.scrollWidth / 2
        }
      }
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)

    const pause = () => { userActive.current = true }
    const resume = () => { setTimeout(() => { userActive.current = false }, 1500) }

    el.addEventListener("mouseenter", pause)
    el.addEventListener("mouseleave", resume)
    el.addEventListener("touchstart", pause, { passive: true })
    el.addEventListener("touchend", resume)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      el.removeEventListener("mouseenter", pause)
      el.removeEventListener("mouseleave", resume)
      el.removeEventListener("touchstart", pause)
      el.removeEventListener("touchend", resume)
    }
  }, [])

  function scrollCarousel(dir: "left" | "right") {
    const el = carouselRef.current
    if (!el) return
    userActive.current = true
    el.scrollBy({ left: dir === "right" ? 340 : -340, behavior: "smooth" })
    setTimeout(() => { userActive.current = false }, 2000)
  }

  return (
    <div className="flex flex-col">

      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section id="home" className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center overflow-hidden">

        {/* YouTube background embed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
          <iframe
            src="https://www.youtube.com/embed/w5xqWh8o2JY?autoplay=1&mute=1&loop=1&playlist=w5xqWh8o2JY&controls=0&rel=0&modestbranding=1&showinfo=0&playsinline=1&disablekb=1"
            allow="autoplay; encrypted-media; picture-in-picture"
            title="VRZ Background"
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "max(100vw, 177.78vh)",
              height: "max(56.25vw, 100vh)",
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              border: "none",
              opacity: 0.35,
            }}
          />
        </div>

        {/* Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-black" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_35%,#00FF7F07,transparent)]" style={{ zIndex: 1 }} />
        <div className="absolute inset-0 opacity-[0.04]" style={{ zIndex: 1, backgroundImage: "linear-gradient(to right,#00FF7F 1px,transparent 1px),linear-gradient(to bottom,#00FF7F 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute inset-0 noise-overlay scanlines" style={{ zIndex: 1 }} />
        <div className="absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-black to-transparent" style={{ zIndex: 2 }} />

        {/* Content */}
        <div className="relative flex flex-col items-center text-center px-4 max-w-4xl mx-auto" style={{ zIndex: 3 }}>
          <span className="mb-8 inline-flex items-center gap-2 rounded-full border border-vrz-green/30 bg-vrz-green/5 px-4 py-1.5 text-xs font-medium text-vrz-green uppercase tracking-widest vrz-flicker">
            <ZapIcon className="size-3" />
            Byblos, Lebanon
          </span>

          <h1 style={{ fontFamily: "var(--font-heading)", lineHeight: 1, marginBottom: "0.15em" }}>
            <ARZLogo
              className="text-[clamp(6rem,20vw,14rem)] text-white tracking-wider"
              style={{ fontFamily: "var(--font-heading)" }}
            />
          </h1>

          <p className="font-heading text-[clamp(1.2rem,3.5vw,2.5rem)] text-vrz-green text-glow-green tracking-[0.35em] uppercase mb-8"
            style={{ fontFamily: "var(--font-heading)" }}>
            Enter the Hunt
          </p>

          <p className="max-w-lg text-base text-zinc-400 leading-relaxed mb-10">
            Lebanon&apos;s most immersive VR hunting lounge. Six dedicated stations,
            zero mercy. Book your session and step into a parallel world.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#book"
              className="flex items-center justify-center gap-2 rounded-lg bg-vrz-green px-8 py-4 text-sm font-bold text-black hover:bg-vrz-green/90 transition-all hover:scale-105 shadow-[0_0_30px_#00FF7F30]">
              Book a Session <ArrowRightIcon className="size-4" />
            </a>
            <a href="#experience"
              className="flex items-center justify-center rounded-lg border border-white/15 px-8 py-4 text-sm font-medium text-zinc-300 hover:border-vrz-green/40 hover:text-vrz-green transition-all">
              Explore VRZ
            </a>
          </div>
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-zinc-700" style={{ zIndex: 3 }}>
          <div className="h-10 w-px bg-gradient-to-b from-transparent to-vrz-green/40" />
          <span className="text-xs uppercase tracking-widest">Scroll</span>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 border-t border-white/5 bg-gradient-to-b from-transparent via-vrz-green/[0.02] to-transparent">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">Pricing</span>
            <h2 className="font-heading text-4xl sm:text-6xl text-white mb-4" style={{ fontFamily: "var(--font-heading)" }}>Fair &amp; Simple</h2>
            <p className="text-zinc-500 mb-8">Weekday and weekend rates. All prices in USD.</p>
            <div className="inline-flex rounded-lg border border-white/10 p-1 gap-1">
              <button onClick={() => setWeekendMode(false)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${!weekendMode ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
                Weekday
              </button>
              <button onClick={() => setWeekendMode(true)}
                className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${weekendMode ? "bg-vrz-green text-black" : "text-zinc-400 hover:text-white"}`}>
                Weekend
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <PricingCard type="single" isWeekend={weekendMode} />
            <PricingCard type="private" isWeekend={weekendMode} />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          BOOKING
      ══════════════════════════════════════════════════════ */}
      <section id="book" className="py-24 px-4 border-t border-white/5 scroll-mt-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">Reserve</span>
            <h2 className="font-heading text-4xl sm:text-6xl text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              Book Your Hunt
            </h2>
            <p className="text-sm text-zinc-500">Byblos, Lebanon — daily 3 PM – 11 PM</p>
          </div>
          <BookingSection />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          EXPERIENCE
      ══════════════════════════════════════════════════════ */}
      <section id="experience" className="py-24 px-4 border-t border-white/5 scroll-mt-16">

        {/* Section intro */}
        <div className="mx-auto max-w-3xl text-center mb-20">
          <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">The Experience</span>
          <h2 className="font-heading text-4xl sm:text-7xl text-white leading-none mb-6"
            style={{ fontFamily: "var(--font-heading)" }}>
            VR Hunting
          </h2>
          <p className="text-zinc-400 text-lg leading-relaxed">
            VR hunting at VRZ isn&apos;t a game. It&apos;s a simulation built for people who want to feel what&apos;s at stake —
            with no real risk and all of the adrenaline.
          </p>
        </div>

        {/* Stats bar */}
        <div className="mx-auto max-w-4xl mb-20">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/5 rounded-2xl overflow-hidden border border-white/5">
            {stats.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center justify-center gap-1 bg-black py-8 px-4 hover:bg-vrz-green/5 transition-colors">
                <span className="font-heading text-3xl sm:text-4xl text-vrz-green" style={{ fontFamily: "var(--font-heading)" }}>{value}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What is VR Hunting — split with video */}
        <div className="mx-auto max-w-6xl mb-24">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 items-center">
            <div>
              <h3 className="font-heading text-3xl sm:text-5xl text-white mb-6" style={{ fontFamily: "var(--font-heading)" }}>
                What Is VR Hunting?
              </h3>
              <div className="space-y-4 text-zinc-400 leading-relaxed">
                <p>
                  Virtual reality hunting places you inside photo-realistic environments —
                  dense forests, open fields, mountain terrain — with complete spatial audio
                  and 360° vision. You track, aim, and react as if you&apos;re really there.
                </p>
                <p>
                  At VRZ, each of our six stations is equipped with high-refresh-rate headsets
                  and motion-tracked controllers. The experience is physical, precise, and
                  deeply engaging.
                </p>
                <p>
                  Whether you&apos;re a first-timer or a seasoned player, the simulation adapts
                  to your pace. Nothing can truly prepare you for the first time you step in.
                </p>
              </div>
              <ul className="mt-6 space-y-2">
                {["High-refresh-rate VR headsets", "Full motion-tracked controllers", "Spatial audio & haptic feedback", "Solo, group & private modes"].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300">
                    <CheckIcon className="size-4 text-vrz-green shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Embedded YouTube video */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black shadow-[0_0_60px_#00FF7F10]">
              <iframe
                src="https://www.youtube.com/embed/w5xqWh8o2JY?rel=0&modestbranding=1"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="VRZ Experience Preview"
                className="absolute inset-0 w-full h-full"
              />
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto max-w-6xl mb-24">
          <div className="grid grid-cols-1 gap-px sm:grid-cols-3 rounded-xl overflow-hidden border border-white/5">
            {features.map(({ icon: Icon, title, desc, stat }, i) => (
              <div key={title} className="relative flex flex-col gap-4 bg-black p-8 hover:bg-white/2 transition-colors group">
                <span className="absolute top-6 right-6 font-heading text-5xl text-white/5 group-hover:text-vrz-green/10 transition-colors"
                  style={{ fontFamily: "var(--font-heading)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/3 group-hover:border-vrz-green/30 transition-colors">
                  <Icon className="size-5 text-zinc-400 group-hover:text-vrz-green transition-colors" />
                </div>
                <div>
                  <p className="text-xs text-vrz-green font-medium uppercase tracking-wider mb-1">{stat}</p>
                  <h3 className="font-heading text-2xl text-white mb-2" style={{ fontFamily: "var(--font-heading)" }}>{title}</h3>
                  <p className="text-sm text-zinc-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ══════════════════════════════════════════════════════
          REVIEWS — single-row carousel
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-4 border-t border-white/5 bg-gradient-to-b from-transparent via-vrz-green/[0.015] to-transparent">
        <div className="mx-auto max-w-6xl">

          {/* Header + nav buttons */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">Voices from the Field</span>
              <h2 className="font-heading text-4xl sm:text-6xl text-white" style={{ fontFamily: "var(--font-heading)" }}>
                What Hunters Say
              </h2>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => scrollCarousel("left")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 hover:border-vrz-green/50 hover:text-vrz-green transition-all"
                aria-label="Previous"
              >
                <ChevronLeftIcon className="size-5" />
              </button>
              <button
                onClick={() => scrollCarousel("right")}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-zinc-400 hover:border-vrz-green/50 hover:text-vrz-green transition-all"
                aria-label="Next"
              >
                <ChevronRightIcon className="size-5" />
              </button>
            </div>
          </div>

          {/* Carousel track */}
          <div
            ref={carouselRef}
            className="flex gap-4 overflow-x-auto pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {CAROUSEL_ITEMS.map(({ quote, name, tag, stars }, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-4 rounded-xl border border-white/8 bg-white/2 p-6 hover:border-white/15 transition-all shrink-0"
                style={{ width: "clamp(280px, 33vw, 360px)" }}
              >
                {/* Stars */}
                <div className="flex gap-0.5">
                  {Array.from({ length: stars }).map((_, i) => (
                    <StarIcon key={i} className="size-3.5 fill-vrz-green text-vrz-green" />
                  ))}
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed flex-1 italic">
                  &ldquo;{quote}&rdquo;
                </p>
                <div className="pt-3 border-t border-white/5 flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-vrz-green/10 border border-vrz-green/20 text-xs font-bold text-vrz-green shrink-0">
                    {name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white leading-none">{name}</p>
                    <p className="text-xs text-vrz-green/60 mt-0.5">{tag}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════════════════ */}
      <section id="contact" className="py-24 px-4 border-t border-white/5 scroll-mt-16">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold uppercase tracking-widest text-vrz-green mb-4 block">Get In Touch</span>
            <h2 className="font-heading text-4xl sm:text-6xl text-white" style={{ fontFamily: "var(--font-heading)" }}>
              Contact VRZ
            </h2>
            <p className="text-zinc-500 mt-3 max-w-md mx-auto">
              Questions, group bookings, or just want to know more? We&apos;re easy to reach.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {/* WhatsApp */}
            <a href="https://wa.me/96170000000" target="_blank" rel="noopener noreferrer"
              className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-white/2 p-6 hover:border-[#25D366]/40 hover:bg-[#25D366]/5 transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]/10 border border-[#25D366]/20">
                <MessageCircleIcon className="size-5 text-[#25D366]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">WhatsApp</p>
                <p className="text-xs text-zinc-500 mb-2">Fastest way to reach us.</p>
                <span className="text-xs font-medium text-[#25D366]">+961 70 000 000</span>
              </div>
            </a>

            {/* Email */}
            <a href="mailto:bookings@vrz.lb"
              className="group flex flex-col gap-4 rounded-xl border border-white/10 bg-white/2 p-6 hover:border-vrz-green/40 hover:bg-vrz-green/5 transition-all">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-vrz-green/10 border border-vrz-green/20">
                <MailIcon className="size-5 text-vrz-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Email</p>
                <p className="text-xs text-zinc-500 mb-2">For detailed inquiries.</p>
                <span className="text-xs font-medium text-vrz-green">bookings@vrz.lb</span>
              </div>
            </a>

            {/* Location */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/2 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-vrz-green/10 border border-vrz-green/20">
                <MapPinIcon className="size-5 text-vrz-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">Location</p>
                <p className="text-xs text-zinc-500">Byblos (Jbeil)</p>
                <p className="text-xs text-zinc-600 mt-0.5">North Lebanon</p>
              </div>
            </div>

            {/* Hours */}
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/2 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-vrz-green/10 border border-vrz-green/20">
                <ClockIcon className="size-5 text-vrz-green" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-2">Hours</p>
                <p className="text-xs text-zinc-400">Daily</p>
                <p className="text-xs font-medium text-white mt-0.5">3:00 PM – 11:00 PM</p>
              </div>
            </div>
          </div>

          {/* Walk-ins note */}
          <div className="mt-6 rounded-xl border border-vrz-green/15 bg-vrz-green/5 px-6 py-4 flex items-start gap-4">
            <PhoneIcon className="size-5 text-vrz-green shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-white mb-0.5">Walk-ins Welcome</p>
              <p className="text-sm text-zinc-500">
                No reservation? Walk in during operating hours if machines are available.
                Booking in advance guarantees your slot.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
