import { Hero } from "@/components/sections/hero"
import { About } from "@/components/sections/about"
import { FeaturedBooks } from "@/components/sections/featured-books"
import { Testimonials } from "@/components/sections/testimonails"
import { Pricing } from "@/components/sections/pricing"
import { Contact } from "@/components/sections/contact"
import { UpdatesBar } from "@/components/layout/updates-bar"

export default function HomePage() {
  return (
    <>
      <Hero />
      <UpdatesBar />
      <About />
      <FeaturedBooks />
      <Testimonials />
      <Pricing />
      <Contact />
    </>
  )
}