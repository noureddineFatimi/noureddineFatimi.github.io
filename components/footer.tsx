import { GitBranch, LinkIcon, Mail } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  const socialLinks = [
    {
      icon: GitBranch,
      href: 'https://github.com/noureddineFatimi',
      label: 'GitHub',
    },
    {
      icon: LinkIcon,
      href: 'https://www.linkedin.com/in/noureddine-el-fatimi/',
      label: 'LinkedIn',
    },
    {
      icon: Mail,
      href: 'mailto:noureddineelfatimi03@gmail.com',
      label: 'Email',
    },
  ]

  return (
    <footer className="border-t border-border py-12 bg-card/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="font-bold text-2xl text-primary">NOUREDDINE EL FATIMI</div>
            <p className="text-foreground/60 text-sm">
              Software Engineer & AI Specialist
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '#about', label: 'About' },
                { href: '#skills', label: 'Skills' },
                { href: '#experience', label: 'Experience' },
                { href: '#projects', label: 'Projects' },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-foreground/60 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social Links */}
          <div className="space-y-3">
            <h3 className="font-semibold text-foreground">Connect</h3>
            <div className="flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.href}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-secondary rounded-lg text-foreground/60 hover:text-primary hover:bg-primary/10 transition-all"
                    aria-label={social.label}
                  >
                    <Icon className="w-5 h-5" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-foreground/60">
            <p>
              © {currentYear} Noureddine El Fatimi. All rights reserved.
            </p>
            
          </div>
        </div>
      </div>
    </footer>
  )
}
