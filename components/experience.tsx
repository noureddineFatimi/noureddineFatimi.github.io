import {GitBranch } from "lucide-react"

export function Experience() {
  const experiences = [
    {
      company: 'Oritech',
      position: 'Software Engineer – AI & Spring Boot',
      period: 'Feb 2026 - Jul 2026 (6 months)',
      location: 'Casablanca, Morocco',
      type: 'Internship - Final Year Project',
      highlights: [
        'Designed and developed an intelligent conversational assistant for the Atracio ERP platform',
        'Built a Spring Boot architecture integrating Spring AI and OpenAI language models for natural language ERP interaction',
        'Implemented Tool Calling mechanism enabling the AI model to interpret user requests and execute business operations via REST APIs',
        'Created an agent orchestrator managing conversations, system prompts, and response normalization between AI model and ERP services',
        'Developed a React.js web interface providing intuitive conversational user experience',
        'Implemented JWT-based secure authentication, tenant management, and secure API communication',
      ],
      links: ["https://github.com/noureddineFatimi/Atracio-Agent-v1", "https://github.com/noureddineFatimi/Atracio-agent-chat-interface"]
    },
    {
      company: 'WESERVEIT TECHNOLOGIES',
      position: 'Full Stack Developer',
      period: 'Jul 2025 - Aug 2025 (2 months)',
      location: 'Casablanca, Morocco',
      type: 'Internship',
      highlights: [
        'Developed full-stack web application for job offer management with public and admin interfaces',
        'Designed secure REST APIs using FastAPI, initially with SQLite, then deployed with PostgreSQL Flexible Server on Azure',
        'Implemented JWT authentication reserved for administrators and auto-generated Swagger documentation',
        'Built public interface for job browsing and applications, and admin dashboard with CRUD operations and statistics',
        'Integrated Ant Design for modern UI and Hugging Face NLP API for automatic post summary generation',
        'Containerized application with Docker and Docker Compose, deployed frontend and backend on Azure App Services',
      ],
      links:["https://github.com/noureddineFatimi/job-management-api","https://github.com/noureddineFatimi/job-management-ui"]
    },
    {
      company: 'CFG Bank',
      position: 'Back-end Developer',
      period: 'Aug 2024 (1 month)',
      location: 'Casablanca, Morocco',
      type: 'Internship',
      highlights: [
        'Developed REST API with Spring Boot (Maven) for savings account management in banking system',
        'Implemented endpoints for user management, contract creation, and withdrawal operations with MySQL integration',
        'Implemented HTTP Basic authentication mechanism to secure resource access',
        'Created comprehensive documentation and testing using Swagger',
      ],
      links:["https://github.com/noureddineFatimi/Savings-Account-API"]
    },
    {
      company: 'AUTO HALL',
      position: 'Front-end Developer',
      period: 'Jul 2024 (1 month)',
      location: 'Casablanca, Morocco',
      type: 'Internship',
      highlights: [
        'Developed interactive HR resource management dashboard with authentication page',
        'Designed mockups in Webflow and integrated them into React using Material-UI',
        'Implemented React hooks (useState, useEffect), API calls via Axios, navigation with React Router DOM',
        'Added data export functionality to .xlsx format',
      ],
      links:["https://github.com/noureddineFatimi/HR-Dashboard"]
    },
  ]

  return (
    <section id="experience" className="py-24 sm:py-15">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Professional Experience
            </h2>
            <p className="text-xl text-foreground/60 max-w-2xl">
              From academic projects to production systems, building scalable solutions
            </p>
          </div>

          <div className="space-y-8">
            {experiences.map((exp, index) => (
              <div
                key={index}
                className="relative pl-4 mb-16 border-l-2 border-accent/30 hover:border-primary/50 transition-colors last:pb-0"
              >
                {/* Timeline dot */}

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                    <div className="lg:sticky lg:top-24 self-start space-y-3">
  <div>
    <h3 className="text-xl font-semibold text-foreground">
      {exp.position}
    </h3>
    <p className="text-lg text-accent font-medium">{exp.company}</p>
  </div>

  <div className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/20 w-fit">
    {exp.type}
  </div>

  <div className="flex flex-col gap-2 text-sm text-foreground/60">
    <span>{exp.period}</span>
    <span>{exp.location}</span>
  </div>

<div className="flex flex-row gap-2 text-sm text-foreground/60">
{
  exp.links.map((link, index)=> (
    <a
                      href={link}
                      key={index}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                    >
                      <GitBranch className="w-4 h-4" />
                      Code
                    </a>
  ))
}
    
    

  </div>

</div>

                  
                  <ul className="space-y-2">
                    {exp.highlights.map((highlight, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-3 text-foreground/70 text-sm leading-relaxed"
                      >
                        <span className="text-accent mt-1.5 flex-shrink-0">▸</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
