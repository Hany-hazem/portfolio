import React, { useState, useEffect } from 'react';
import { 
  Github, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  Code,
  Database,
  Server,
  Bot,
  Download,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { fetchGitHubUser, fetchGitHubRepos, getUserSettings, type GitHubUser, type GitHubRepo } from './services/github';

interface Skill {
  name: string;
  level: number;
  category: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  period: string;
  status: string;
  icon: React.ReactNode;
}

function App() {
  const [activeSection, setActiveSection] = useState('hero');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // GitHub data state
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState('Hany-hazem');

  useEffect(() => {
    setIsVisible(true);
    
    const handleScroll = () => {
      const sections = ['hero', 'about', 'skills', 'projects', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch GitHub data on mount
  useEffect(() => {
    async function loadGitHubData() {
      try {
        setLoading(true);
        setError(null);
        
        // Check for user settings first (may not be available on public site)
        let username = 'Hany-hazem'; // default fallback
        try {
          const settings = await getUserSettings();
          username = settings?.github_username || import.meta.env.VITE_GITHUB_USER || 'Hany-hazem';
        } catch (settingsError) {
          // Settings not available, use default
          console.debug('Using default username');
        }
        setGithubUsername(username);
        
        // Fetch user profile and repos in parallel
        const [user, repos] = await Promise.all([
          fetchGitHubUser(username),
          fetchGitHubRepos(username, { sort: 'updated', per_page: 6 })
        ]);
        
        setGithubUser(user);
        setGithubRepos(repos.slice(0, 6));
      } catch (err) {
        console.error('Failed to fetch GitHub data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load GitHub data');
      } finally {
        setLoading(false);
      }
    }
    
    loadGitHubData();
  }, []);

  const skills: Skill[] = [
    { name: 'Python', level: 90, category: 'Programming' },
    { name: 'Java', level: 75, category: 'Programming' },
    { name: 'C#', level: 70, category: 'Programming' },
    { name: 'Linux Administration', level: 85, category: 'Systems' },
    { name: 'Windows', level: 80, category: 'Systems' },
    { name: 'Supabase', level: 65, category: 'Database' },
    { name: 'Web Development', level: 75, category: 'Web' },
    { name: 'SaaS Architecture', level: 70, category: 'Web' },
    { name: 'System Automation', level: 85, category: 'Automation' },
    { name: 'Custom Scripting', level: 90, category: 'Automation' },
    { name: 'LM Studio', level: 60, category: 'AI/ML' },
    { name: 'Flask', level: 80, category: 'Frameworks' },
    { name: 'Node.js', level: 75, category: 'Frameworks' }
  ];

  const projects: Project[] = [
    {
      id: 'saas-task-management',
      title: 'SaaS Task Management Application',
      description: 'Currently developing a comprehensive Software as a Service application for task management within a translation company. Features user assignment, task tracking, workflow management, and integrated AI-powered translation capabilities. Includes fine-tuning AI models to translate English books to Arabic with high quality, providing automated translation services within the platform.',
      technologies: ['Python', 'Flask', 'Node.js', 'Supabase', 'AI Fine-tuning', 'Translation AI', 'SaaS Architecture'],
      period: 'Jul 2025 - Present',
      status: 'In Development',
      icon: <Database className="w-6 h-6" />
    },
    {
      id: 'ai-translation-model',
      title: 'AI Translation Model Fine-tuning',
      description: 'Fine-tuning AI models specifically for high-quality English to Arabic book translation. This specialized model focuses on maintaining literary context, cultural nuances, and technical accuracy. The model will be integrated into the SaaS task management platform to provide automated translation services for the translation company.',
      technologies: ['AI Fine-tuning', 'Machine Learning', 'Translation AI', 'Python', 'Natural Language Processing'],
      period: 'Jul 2025 - Present',
      status: 'In Development',
      icon: <Bot className="w-6 h-6" />
    },
    {
      id: 'ai-assistant',
      title: 'AI Personal Assistant Agent',
      description: 'Developing a personal AI assistant with PC access capabilities. Focuses on task automation and intelligent assistance using Python for control and LM Studio for local language model integration.',
      technologies: ['Python', 'LM Studio', 'AI/ML', 'System Integration'],
      period: 'Jul 2025 - Present',
      status: 'In Development',
      icon: <Bot className="w-6 h-6" />
    },
    {
      id: 'home-server',
      title: 'Home Server Setup',
      description: 'Set up and maintained a home server using a repurposed PC, ensuring continuous operation with Linux server management. Demonstrates system administration and server maintenance skills.',
      technologies: ['Linux', 'Server Management', 'System Administration'],
      period: 'Jan 2025 - Present',
      status: 'Active',
      icon: <Server className="w-6 h-6" />
    },
    {
      id: 'youtube-downloader',
      title: 'YouTube Downloader Script',
      description: 'Developed a custom Python script for automated YouTube video downloads, demonstrating proficiency in scripting and task automation with efficient video processing capabilities.',
      technologies: ['Python', 'Automation', 'Scripting'],
      period: 'Aug 2024 - Sep 2024',
      status: 'Completed',
      icon: <Download className="w-6 h-6" />
    }
  ];

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const skillCategories = [...new Set(skills.map(skill => skill.category))];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Hani Hazem
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {['About', 'Skills', 'Projects', 'Contact'].map((item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeSection === item.toLowerCase()
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-gray-900 border-t border-gray-800">
              {['About', 'Skills', 'Projects', 'Contact'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-700 w-full text-left"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-teal-900/20"></div>
        <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <div className={`transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
            {loading ? (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
                <p className="text-gray-400">Loading profile...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center">
                <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
                <p className="text-red-400 mb-2">Failed to load GitHub profile</p>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
            ) : (
              <>
                {githubUser?.avatar_url && (
                  <div className="mb-6">
                    <img 
                      src={githubUser.avatar_url} 
                      alt={githubUser.name || githubUser.login}
                      className="w-32 h-32 rounded-full mx-auto border-4 border-blue-600 shadow-lg"
                    />
                  </div>
                )}
                <h1 className="text-4xl sm:text-6xl font-bold mb-6">
                  <span className="block">{githubUser?.name || 'Hani Hazem'}</span>
                  <span className="block text-2xl sm:text-4xl bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                    {githubUser?.login || 'Elbegermy'}
                  </span>
                </h1>
                <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
                  Computer Science Student & Tech Enthusiast
                </p>
                <p className="text-lg text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                  {githubUser?.bio || 'A passionate computer science student exploring various fields including backend development, system administration, and AI development. Always eager to learn new technologies and build innovative solutions while discovering my path in the tech world.'}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <button
                    onClick={() => scrollToSection('projects')}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
                  >
                    View My Work
                  </button>
                  <a
                    href={githubUser?.html_url || `https://github.com/${githubUsername}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 border border-gray-600 rounded-lg font-semibold hover:bg-gray-800 transition-all duration-300 flex items-center gap-2"
                  >
                    <Github className="w-5 h-5" />
                    GitHub
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-gray-400" />
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">About Me</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto"></div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl p-8 text-center">
                {githubUser?.avatar_url && (
                  <img 
                    src={githubUser.avatar_url} 
                    alt={githubUser.name || githubUser.login}
                    className="w-20 h-20 rounded-full mx-auto mb-4 border-2 border-white"
                  />
                )}
                {!githubUser?.avatar_url && <User className="w-20 h-20 mx-auto mb-4 text-white" />}
                <h3 className="text-2xl font-bold mb-2">{githubUser?.name || 'Hani Hazem Elbegermy'}</h3>
                <p className="text-blue-100">Backend Developer & Systems Administrator</p>
              </div>
              
              <div className="mt-8 space-y-4">
                {githubUser?.email && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>{githubUser.email}</span>
                  </div>
                )}
                {!githubUser?.email && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <span>hany.hazem.cs@gmail.com</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="w-5 h-5 text-blue-400" />
                  <span>+201027579528</span>
                </div>
                {githubUser?.location && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span>{githubUser.location}</span>
                  </div>
                )}
                {!githubUser?.location && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <span>Cairo, Egypt</span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-gray-300">
                  <Github className="w-5 h-5 text-blue-400" />
                  <a href={githubUser?.html_url || `https://github.com/${githubUsername}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                    {githubUser?.login || githubUsername}
                  </a>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h3 className="text-2xl font-bold mb-4">My Journey</h3>
              <p className="text-gray-300 leading-relaxed">
                I am a proactive and self-driven individual with a strong passion for technology and hands-on problem-solving. 
                Currently pursuing my Bachelor's Degree in Computer Science at Arab Open University, I continuously engage in 
                personal projects to expand my technical skills and explore new concepts.
              </p>
              <p className="text-gray-300 leading-relaxed">
                My expertise spans across backend development, Linux system administration, and AI agent creation. 
                I'm eager to contribute a blend of practical experience and a commitment to continuous learning to dynamic roles 
                in the tech industry.
              </p>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal-400" />
                  Education
                </h4>
                <div>
                  <p className="font-medium">Bachelor's Degree in Computer Science</p>
                  <p className="text-gray-400">Arab Open University</p>
                  <p className="text-sm text-gray-500">Sep 2020 - Present • Cairo, Egypt</p>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm">Problem Solving</span>
                <span className="px-3 py-1 bg-teal-600/20 text-teal-400 rounded-full text-sm">Self-Motivated</span>
                <span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-sm">Quick Learning</span>
                <span className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm">Critical Thinking</span>
                <span className="px-3 py-1 bg-orange-600/20 text-orange-400 rounded-full text-sm">Time Management</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section id="skills" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Technical Skills</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {skillCategories.map((category, categoryIndex) => (
              <div
                key={category}
                className="bg-gray-900 rounded-xl p-6 hover:bg-gray-800 transition-colors duration-300"
              >
                <h3 className="text-xl font-bold mb-6 text-center">
                  <Code className="w-6 h-6 inline-block mr-2 text-blue-400" />
                  {category}
                </h3>
                <div className="space-y-4">
                  {skills
                    .filter(skill => skill.category === category)
                    .map((skill, index) => (
                      <div key={skill.name} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">{skill.name}</span>
                          <span className="text-sm text-gray-400">{skill.level}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-teal-500 h-2 rounded-full transition-all duration-1000 ease-out"
                            style={{
                              width: `${skill.level}%`,
                              animationDelay: `${categoryIndex * 0.2 + index * 0.1}s`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex flex-wrap gap-3 justify-center">
              <span className="px-4 py-2 bg-blue-600/20 text-blue-400 rounded-lg">English (Fluent)</span>
              <span className="px-4 py-2 bg-teal-600/20 text-teal-400 rounded-lg">Arabic (Native)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Featured Projects</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto"></div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
            </div>
          ) : githubRepos.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-8">
              {githubRepos.map((repo) => (
                <div
                  key={repo.id}
                  className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
                          <Code className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{repo.name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            {repo.language && (
                              <span className="text-gray-400">{repo.language}</span>
                            )}
                            <span className="text-gray-500">★ {repo.stargazers_count}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {repo.description || 'No description available'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {repo.topics?.slice(0, 5).map((topic) => (
                        <span
                          key={topic}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>

                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors"
                    >
                      View on GitHub
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-gray-800 rounded-xl overflow-hidden hover:bg-gray-700 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-2xl"
                >
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg">
                          {project.icon}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold mb-1">{project.title}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-400">{project.period}</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              project.status === 'In Development' 
                                ? 'bg-yellow-600/20 text-yellow-400'
                                : project.status === 'Active'
                                ? 'bg-green-600/20 text-green-400'
                                : 'bg-blue-600/20 text-blue-400'
                            }`}>
                              {project.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-300 leading-relaxed mb-6">
                      {project.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="px-3 py-1 bg-gray-700 text-gray-300 rounded-lg text-sm"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <a
              href={githubUser?.html_url || `https://github.com/${githubUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105"
            >
              <Github className="w-5 h-5" />
              View All Projects on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Get In Touch</h2>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-400 to-teal-400 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Let's Connect</h3>
              <p className="text-gray-300 mb-8 leading-relaxed">
                I'm always interested in new opportunities and exciting projects. 
                Whether you want to collaborate on a project or just say hello, 
                feel free to reach out!
              </p>
              
              <div className="space-y-6">
                <a
                  href="mailto:hany.hazem.cs@gmail.com"
                  className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium">Email</p>
                    <p className="text-gray-400">hany.hazem.cs@gmail.com</p>
                  </div>
                </a>

                <a
                  href="tel:+201027579528"
                  className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p className="text-gray-400">+201027579528</p>
                  </div>
                </a>

                <a
                  href={githubUser?.html_url || `https://github.com/${githubUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors group"
                >
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg group-hover:scale-110 transition-transform">
                    <Github className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium">GitHub</p>
                    <p className="text-gray-400">github.com/{githubUser?.login || githubUsername}</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-8">
              <h3 className="text-xl font-bold mb-6">Quick Facts</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Based in Cairo, Egypt</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Computer Science Student</span>
                </div>
                <div className="flex items-center gap-3">
                  <Code className="w-5 h-5 text-blue-400" />
                  <span className="text-gray-300">Backend Developer</span>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-gradient-to-r from-blue-600/20 to-teal-600/20 rounded-lg border border-blue-600/30">
                <p className="text-sm text-gray-300">
                  <strong className="text-blue-400">Open to opportunities:</strong> I'm actively seeking 
                  full-time positions and freelance projects in backend development, AI/ML, and system administration.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400">
           © 2025 Hani Hazem Elbegermy. Computer Science Student & Tech Enthusiast.
          </p>
        </div>
      </footer>

    </div>
  );
}

export default App;