import { Award, Bot, BrainCircuit, Cable } from 'lucide-react'

export function Certifications() {
  const certifications = [
    {
      title: 'Intro to LLMs',
      issuer: 'Professional Certification',
      description: 'Comprehensive introduction to Large Language Models and their applications',
      icon: <BrainCircuit />,
      link:"https://learn.365datascience.com/certificates/CC-F654E78AA2/"
    },
    {
      title: 'MCP Servers Made Easy with Python and OpenAI Agents',
      issuer: 'Professional Certification',
      description: 'Building Model Context Protocol servers and AI agents with Python',
      icon: <Bot />,
      link:"https://codesignal.com/learn/certificates/cmgdivazw00ejl604uurstgzy/course-paths/287"
    },
    {
      title: 'Postman API Fundamentals Student Expert',
      issuer: 'Postman Academy',
      description: 'Expert-level knowledge of API development and testing with Postman',
      icon: <Cable />,
      link:"https://badges.parchment.com/public/assertions/FnmvGob8Rmu1ZR8PW_clZg"
    },
  ]

  const education = [
    {
      school: 'Ecole Nationale des Sciences Appliquées - Kénitra',
      degree: 'Diplôme d\'Ingénieur',
      field: 'Génie Informatique (Computer Engineering)',
      period: 'September 2023 - June 2026',
      status: 'Completed',
    },
    {
      school: 'École Nationale des Sciences Appliquées de Tétouan',
      degree: 'Cycle Préparatoire',
      field: 'Preparatory Cycle',
      period: 'September 2021 - June 2023',
      status: 'Completed',
    },
  ]

  return (
    <section id="certifications" className="py-24 sm:py-15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-16">
          {/* Certifications */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
                Certifications & Achievements
              </h2>
              <p className="text-xl text-foreground/60 max-w-2xl">
                Continuous learning and professional development credentials
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {certifications.map((cert, index) => (
                <div
                  key={index}
                  className="group relative bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="text-4xl">{cert.icon}</div>
                      <Award className="w-5 h-5 text-accent" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        <a href={cert.link}  target="_blank"
                      rel="noopener noreferrer">{cert.title}</a>
                      </h3>
                      <p className="text-sm text-accent font-medium">{cert.issuer}</p>
                      <p className="text-sm text-foreground/60 leading-relaxed">
                        {cert.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Education */}
          <div className="space-y-8 pt-8 border-t border-border">
            <div className="space-y-4">
              <h3 className="text-3xl font-bold text-foreground">Education</h3>
              <p className="text-lg text-foreground/60">
                Engineering education and academic background
              </p>
            </div>

            <div className="space-y-6">
              {education.map((edu, index) => (
                <div
                  key={index}
                  className="relative pl-8 pb-6 border-l-2 border-accent/30 hover:border-primary/50 transition-colors last:pb-0"
                >
                  {/* Timeline dot */}
                  <div className="absolute left-[-9px] top-0 w-4 h-4 bg-accent rounded-full border-2 border-background"></div>

                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">
                          {edu.degree}
                        </h4>
                        <p className="text-accent font-medium">{edu.school}</p>
                      </div>
                      <span
                        className={`inline-block px-3 py-1 text-xs font-medium rounded-full border w-fit ${
                          edu.status === 'In Progress'
                            ? 'bg-accent/10 text-accent border-accent/20'
                            : 'bg-primary/10 text-primary border-primary/20'
                        }`}
                      >
                        {edu.status}
                      </span>
                    </div>

                    <p className="text-sm text-foreground/70">{edu.field}</p>
                    <p className="text-sm text-foreground/60">{edu.period}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
