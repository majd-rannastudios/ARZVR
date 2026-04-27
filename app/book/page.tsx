import BookingSection from "@/components/BookingSection"

export const dynamic = "force-dynamic"

export default function BookPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <h1
          className="font-heading text-4xl sm:text-6xl text-white"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Book Your Hunt
        </h1>
        <p className="text-sm text-zinc-500 mt-1">Byblos, Lebanon — daily 3 PM – 11 PM</p>
      </div>
      <BookingSection />
    </div>
  )
}
