import { Hero } from "@/components/sections/hero"
import { About } from "@/components/sections/about"
import { FeaturedBooks } from "@/components/sections/featured-books"
import { Testimonials } from "@/components/sections/testimonails"
import { Pricing } from "@/components/sections/pricing"
import { Contact } from "@/components/sections/contact"

export default function HomePage() {
  return (
    <>
      <Hero />
      <About />
      <FeaturedBooks />
      <Testimonials />
      <Pricing />
      <Contact />
    </>
  )
}