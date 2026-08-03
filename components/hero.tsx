import { ArrowRight, GitBranch, LinkIcon, Mail } from 'lucide-react'

export function Hero() {
  return (
    <section id="about" className="relative py-24 sm:py-15 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block  ">
                <p className="text-2xl font-medium text-accent " >Hy, I'm
                </p>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold text-foreground text-balance">
                Noureddine El Fatimi
              </h1>
              <p className="text-xl text-foreground/70">
                Software Engineer & AI Specialist
              </p>
            </div>

            <p className="text-lg text-foreground/60 leading-relaxed max-w-xl">
              Passionate about building intelligent applications and modern cloud architectures. I specialize in designing robust solutions using Spring Boot, React, and generative AI technologies to create AI agents that interact seamlessly with business systems.
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Get in Touch
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#projects"
                className="inline-flex items-center gap-2 px-6 py-3 border border-border text-foreground rounded-lg font-medium hover:bg-secondary transition-colors"
              >
                View My Work
              </a>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-6 pt-4">
              <a
                href="https://github.com/noureddineFatimi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-primary transition-colors"
                aria-label="GitHub"
              >
                <GitBranch className="w-6 h-6" />
              </a>
              <a
                href="https://www.linkedin.com/in/noureddine-el-fatimi/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground/60 hover:text-primary transition-colors"
                aria-label="LinkedIn"
              >
                <LinkIcon className="w-6 h-6" />
              </a>
              <a
                href="mailto:noureddineelfatimi03@gmail.com"
                className="text-foreground/60 hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="w-6 h-6" />
              </a>
            </div>
          </div>

          {/* Right Visual */}
<div className="relative hidden lg:flex items-center justify-center">
  {/* Halo lumineux derrière */}
  <div className="absolute w-80 h-80 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-3xl"></div>

  {/* Cadre */}
  <div className="relative p-2 rounded-full bg-gradient-to-br from-primary to-accent shadow-2xl">
    <div className="rounded-full overflow-hidden border-4 border-background">
      <img
        src="photo.jpg"
        alt="Noureddine El Fatimi"
        className="w-72 h-72 object-cover"
      />
    </div>
  </div>
</div>
          
        </div>
      </div>
    </section>
  )
}
