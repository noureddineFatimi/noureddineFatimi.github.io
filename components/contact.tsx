'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import { useState } from 'react'
import { Download } from 'lucide-react'

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Simulate form submission
    setTimeout(() => {
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
      setTimeout(() => setSubmitted(false), 3000)
    }, 500)
  }

  const contactInfo = [
    {
      icon: Mail,
      label: 'Email',
      value: 'noureddineelfatimi03@gmail.com',
      href: 'mailto:noureddineelfatimi03@gmail.com',
    },
    {
      icon: MapPin,
      label: 'Location',
      value: 'Casablanca, Morocco',
      href: '#',
    },
    {
      icon: Phone,
      label: 'LinkedIn',
      value: 'linkedin.com/in/noureddine-el-fatimi/',
      href: 'https://www.linkedin.com/in/noureddine-el-fatimi/',
    },
  ]

  return (
    <section id="contact" className="py-24 sm:py-15 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left - Contact Info */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                Let&apos;s Connect
              </h2>
              <p className="text-xl text-foreground/60">
                I&apos;m always interested in hearing about new opportunities and collaborations.
              </p>
            </div>

            <div className="space-y-6">
              {contactInfo.map((info, index) => {
                const Icon = info.icon
                return (
                  <a
                    key={index}
                    href={info.href}
                    target={info.href.startsWith('http') ? '_blank' : undefined}
                    rel={info.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="flex items-start gap-4 group"
                  >
                    <div className="mt-1 p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground/60">
                        {info.label}
                      </p>
                      <p className="text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                        {info.value}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>

            <div className="pt-4 border-t border-border space-y-4">
              <p className="text-sm text-foreground/60">
                Open to opportunities in:
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Software Engineering',
                  'AI Engineering',
                  'Backend Development',
                  'Cloud Architecture',
                  'Tech Startups',
                ].map((opp) => (
                  <span
                    key={opp}
                    className="px-3 py-1 bg-accent/10 text-accent text-sm font-medium rounded-full border border-accent/20"
                  >
                    {opp}
                  </span>
                ))}
              </div>
            </div>
          </div>

         {/* Right - Download CV */}
<div className="flex items-center">
  <div className="w-full bg-background border border-border rounded-xl p-8 space-y-6">
    <div className="space-y-3">
      <h3 className="text-2xl font-semibold text-foreground">
        Download My CV
      </h3>

      <p className="text-foreground/60 leading-relaxed">
        Looking for more details about my experience, technical skills, and
        projects? Download my resume in PDF format.
      </p>
    </div>

    <div className="rounded-lg border border-border bg-card p-5">
      <p className="font-medium text-foreground">
        Noureddine El Fatimi
      </p>
      <p className="text-sm text-foreground/60">
        Software Engineer • AI & Backend Development
      </p>
    </div>

   <a
  href="CV_NOUREDDINE_ELFATIMI.pdf"
  download
  className="inline-flex items-center justify-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
>
  <Download className="w-5 h-5 mr-2" />
  Download Resume
</a>
  </div>
</div>
        </div>
      </div>
    </section>
  )
}
