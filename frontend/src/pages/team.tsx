"use client"

import { useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Linkedin, Twitter, BookOpen } from "lucide-react"
import { useTeam } from "@/hooks/use-team"
import anime from "animejs"

export default function TeamPage() {
  const sectionRef = useRef<HTMLElement>(null)
  const { team, loading } = useTeam()

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            anime({
              targets: ".team-card",
              opacity: [0, 1],
              translateY: [50, 0],
              scale: [0.9, 1],
              delay: anime.stagger(150),
              duration: 800,
              easing: "easeOutQuart",
            })
          }
        })
      },
      { threshold: 0.1 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="py-20 bg-background min-h-screen">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Meet Our Team
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The passionate individuals behind DNA Publications who make literary dreams come true
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading team members...</p>
          </div>
        ) : team.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Team Members</h3>
            <p className="text-muted-foreground">Team information will be available soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {team.map((member: any, _index: number) => (
              <Card key={member.id} className="team-card group hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <div className="mb-6">
                    <img
                      src={member.imageUrl}
                      alt={member.name}
                      className="w-32 h-32 rounded-full mx-auto object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-foreground">{member.name}</h3>

                  <Badge variant="secondary" className="mb-4">
                    {member.role}
                  </Badge>

                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{member.bio}</p>

                  {/* Social Links */}
                  <div className="flex justify-center space-x-3">
                    {member.email && (
                      <a
                        href={`mailto:${member.email}`}
                        className="p-2 rounded-full bg-muted hover:bg-orange-100 transition-colors group"
                      >
                        <Mail className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-orange-100 transition-colors group"
                      >
                        <Linkedin className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
                      </a>
                    )}
                    {member.twitter && (
                      <a
                        href={member.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full bg-muted hover:bg-orange-100 transition-colors group"
                      >
                        <Twitter className="h-4 w-4 text-muted-foreground group-hover:text-orange-600" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}