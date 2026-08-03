import { ExternalLink, GitBranch } from 'lucide-react'

export function Projects() {
  const projects = [
    {
      title: 'Atracio AI Assistant',
      description:
        'Intelligent conversational assistant for ERP systems enabling natural language interaction with business operations through AI-powered tool calling.',
      technologies: [
        'Spring Boot',
        'Spring AI',
        'OpenAI',
        'React.js',
        'AI Agents',
        'JWT',
      ],
      highlights: [
        'Tool Calling mechanism for automated business operations',
        'Multi-turn conversation management',
        'Secure tenant isolation',
        'Real-time API integration',
      ],
      status: 'Completed',
      link: "https://github.com/noureddineFatimi/Atracio-Agent-v1"
    },
    {
      title: 'Java Job Scraper & Analyzer',
      description:
        'A powerful desktop application in Java for scraping, storing, analyzing, and predicting job advertisement data. The application allows users to search job listings based on various filters, visualize trends using charts (JFreeChart), and predict required education levels using machine learning (Weka). All data is stored and queried through a MySQL database.',
      technologies: [
        'Java',
        'MySQL',
        'Weka',
        'JFreeChart',
        'Maven',
        'Jsoup',
      ],
      highlights: [
        'Automatically scrape job listings from online sources',
        'Filter job ads by title, location, contract type, experience, or keyword',
        'Predict the expected education level for a given job using Weka models',
        'Interactive charts for analyzing job distribution by domain, city, contract type, etc.',
      ],
      status: 'Completed',
      link:"https://github.com/noureddineFatimi/Job-Listing-Management-Application"
    },
    {
      title: 'Classified Ads Platform (Inspired by Avito.ma)',
      description:
        'A web application built with Ruby on Rails, allowing users to post, browse, and filter class.',
      technologies: ['Ruby on Rails 7', 'SQLite', 'HTML, CSS', 'Active Storage', 'Devise'],
      highlights: [
        'Homepage with top categories and latest ads',
        'Hierarchical categories (parent/child)',
        'Authentication via sign up / login',
        'Create, update, and delete ads',
      ],
      status: 'Completed',
      link: "https://github.com/noureddineFatimi/Classified-Ads-Platform"
    },
    {
      title: 'HR Management Dashboard',
      description:
        'Interactive dashboard for human resources management with authentication, data visualization, and export capabilities.',
      technologies: [
        'React.js',
        'Material-UI',
        'Webflow',
        'React Router',
        'Axios',
      ],
      highlights: [
        'Responsive design',
        'Data export to .xlsx',
        'Real-time data management',
        'Modern UI components',
      ],
      status: 'Completed',
      link: "https://github.com/noureddineFatimi/HR-Dashboard"
    },
  ]

  const statusColors = {
    'In Development': 'bg-accent/10 text-accent border-accent/20',
    'Completed': 'bg-primary/10 text-primary border-primary/20',
  }

  return (
    <section id="projects" className="py-24 sm:py-15 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Featured Projects
            </h2>
            <p className="text-xl text-foreground/60 max-w-2xl">
              A selection of key projects showcasing technical expertise and problem-solving abilities
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {projects.map((project, index) => (
              <div
                key={index}
                className="group relative bg-background border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                    </div>
                    <span
                      className={`inline-block px-3 py-1 text-xs font-medium rounded-full border ${
                        statusColors[project.status as keyof typeof statusColors]
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-foreground/70 leading-relaxed text-sm">
                    {project.description}
                  </p>

                  {/* Technologies */}
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-2.5 py-1 bg-secondary text-foreground/70 text-xs font-medium rounded border border-border/50 group-hover:border-primary/30 transition-colors"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="pt-2">
                    <ul className="space-y-1.5">
                      {project.highlights.map((highlight, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-sm text-foreground/60"
                        >
                          <span className="text-accent mt-1">✓</span>
                          <span>{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Links */}
                  <div className="flex gap-3 pt-4 border-t border-border/50">
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
                    >
                      <GitBranch className="w-4 h-4" />
                      Code
                    </a>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
