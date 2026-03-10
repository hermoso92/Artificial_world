
import React from 'react';
import { Github, FileText, Code, Users, Mail, BookOpen, ExternalLink } from 'lucide-react';

const resources = [
  {
    title: "GitHub Repository",
    description: "The main source code, simulation engine, and core logic for the Artificial World project.",
    icon: Github,
    link: "https://github.com/hermoso92/Artificial_world"
  },
  {
    title: "Research Paper",
    description: "Detailed methodology, mathematical models, utility functions, and comprehensive findings.",
    icon: FileText,
    link: "https://github.com/hermoso92/Artificial_world/releases"
  },
  {
    title: "Documentation",
    description: "Comprehensive guides, API references, and step-by-step setup instructions for local deployment.",
    icon: BookOpen,
    link: "https://github.com/hermoso92/Artificial_world#readme"
  },
  {
    title: "Code Examples",
    description: "Sample scripts, canonical session configurations, and custom civilization seed templates.",
    icon: Code,
    link: "https://github.com/hermoso92/Artificial_world"
  },
  {
    title: "Author Profile",
    description: "Connect with the creator, view contributions, and explore other open-source projects.",
    icon: Users,
    link: "https://github.com/hermoso92"
  },
  {
    title: "Issues & Discussions",
    description: "Report bugs, request new features, or join the conversation about future developments.",
    icon: Mail,
    link: "https://github.com/hermoso92/Artificial_world/issues"
  }
];

const ResourcesSection = () => {
  return (
    <section className="py-12 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-foreground mb-4">
            Project Resources
          </h2>
          <p className="text-xl text-secondary max-w-2xl mx-auto">
            Everything you need to understand, run, and contribute to the Artificial World simulation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <a 
                key={index}
                href={resource.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col bg-card border border-border rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <ExternalLink className="w-5 h-5 text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="text-secondary text-sm flex-grow">
                  {resource.description}
                </p>
              </a>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ResourcesSection;
