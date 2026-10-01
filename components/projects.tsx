import { ExternalLink, GitBranch } from 'lucide-react'

export function Projects() {
  const projects = [
    {
  title: 'ReKrute Data Platform',
  description:
    'Data engineering platform for collecting, validating, cleaning, and processing job offers from ReKrute through an orchestrated and containerized data pipeline.',
  technologies: [
    'Python',
    'Apache Airflow',
    'Docker Compose',
    'Playwright',
    'dbt',
    'PostgreSQL',
    'AI',
  ],
  highlights: [
    'Automated job offer scraping with Playwright',
    'Proxy management for reliable data collection',
    'Data validation and cleaning pipeline',
    'AI integration for intelligent data cleaning',
    'Workflow orchestration with Apache Airflow',
    'Containerized data pipeline with Docker Compose',
    'Planned data transformation and analysis with dbt',
  ],
  status: 'In Development',
  link: 'https://github.com/noureddineFatimi/Rekrute-data-platform',
},
    {
      title: 'Personal AI Portfolio',
      description:
        'High-performance personal portfolio built with Next.js and TypeScript, featuring an intelligent AI chatbot designed to answer recruiters’ questions about projects, skills, and experience.',
      technologies: [
        'Next.js',
        'TypeScript',
        'React.js',
        'LangChain',
        'Upstash Redis',
        'AI / RAG',
        'Vercel',
      ],
      highlights: [
        'AI-powered chatbot for recruiter interactions',
        'Responsive and SEO-optimized interface',
        'Conversation history and user session management',
        'Redis caching for optimized response times',
        'Continuous deployment with Vercel',
      ],
      status: 'Completed',
      link: 'https://github.com/noureddineFatimi/noureddineFatimi.github.io',
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
  title: 'Sports Ball Detection & Tracking',
  description:
    'Real-time ball detection and tracking system for sports matches using deep learning and computer vision techniques to identify and track the ball in images and videos.',
  technologies: [
    'Python',
    'YOLO',
    'Deep Learning',
    'Computer Vision',
    'Google Colab',
  ],
  highlights: [
    'Real-time ball detection in sports footage',
    'Ball tracking across images and video frames',
    'Deep learning-based object detection',
    'Automatic annotations overlaid on output frames',
    'Model experimentation and training with Google Colab',
  ],
  status: 'Completed',
  link: 'https://github.com/noureddineFatimi/Football-Tracker',
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
