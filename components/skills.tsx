export function Skills() {
  const skillCategories = [
    {
      category: 'AI & Machine Learning',
      skills: [
        'LLM Applications',
        'Prompt Engineering',
        'Tool Calling',
        'AI Agents',
        'NLP Models',
        'Hugging Face',
        'OpenAI Integration',
      ],
    },
    {
      category: 'Backend Development',
      skills: [
        'Spring Boot',
        'Spring AI',
        'FastAPI',
        'REST APIs',
        'Microservices',
        'JWT Authentication',
        'Database Design',
      ],
    },
    {
      category: 'Frontend Development',
      skills: [
        'React.js',
        'React Router',
        'Material-UI',
        'Ant Design',
        'TypeScript',
        'Tailwind CSS',
        'Responsive Design',
      ],
    },
    {
      category: 'Cloud & DevOps',
      skills: [
        'Docker',
        'Docker Compose',
        'Azure App Services',
        'Kubernetes',
        'CI/CD Pipelines',
        'Cloud Architecture',
        'PostgreSQL',
      ],
    },
    {
      category: 'Tools & Platforms',
      skills: [
        'Postman',
        'Swagger/OpenAPI',
        'Git & GitHub',
        'Webflow',
        'Power BI',
        'MySQL',
        'SQLite',
      ],
    },
    {
      category: 'Languages',
      skills: [
        'Java',
        'Python',
        'JavaScript',
        'TypeScript',
        'SQL',
        'HTML/CSS',
        'Bash',
      ],
    },
  ]

  return (
    <section id="skills" className="py-24 sm:py-15 bg-card/50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              Skills & Expertise
            </h2>
            <p className="text-xl text-foreground/60 max-w-2xl">
              A comprehensive toolkit built through diverse project experiences and continuous learning
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {skillCategories.map((category) => (
              <div
                key={category.category}
                className="group relative bg-background border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.skills.map((skill) => (
                    <div
                      key={skill}
                      className="flex items-center gap-2 text-sm text-foreground/70 group-hover:text-foreground/90 transition-colors"
                    >
                      <span className="w-1.5 h-1.5 bg-accent rounded-full"></span>
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
