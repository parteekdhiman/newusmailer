// Simplified course data for backend use
// This is a subset of the full course data optimized for AI processing

const coursesList = [
  {
    name: "Full-Stack Software Engineering Pro",
    description: "Complete full-stack development course covering frontend and backend technologies",
    outcome: "Become a professional full-stack developer capable of building complete web applications",
    duration: "6 months",
    tools: [{ type: "React" }, { type: "Node.js" }, { type: "MongoDB" }],
    content: "HTML, CSS, JavaScript, React, Node.js, Express, MongoDB, Git",
    placement: true,
    type: "Programming",
    coursetype: "Flagship"
  },
  {
    name: "Data Science & Analytics Pro",
    description: "Comprehensive data science course covering statistics, machine learning, and data visualization",
    outcome: "Master data analysis, machine learning algorithms, and data visualization techniques",
    duration: "6 months",
    tools: [{ type: "Python" }, { type: "Pandas" }, { type: "TensorFlow" }],
    content: "Python, Statistics, Machine Learning, Data Visualization, SQL",
    placement: true,
    type: "Programming",
    coursetype: "Flagship"
  },
  {
    name: "Digital Marketing Pro",
    description: "Complete digital marketing course covering all aspects of online marketing",
    outcome: "Become a professional digital marketer with expertise in SEO, SEM, and social media",
    duration: "4 months",
    tools: [{ type: "Google Ads" }, { type: "Facebook Ads" }, { type: "Analytics" }],
    content: "SEO, SEM, Social Media Marketing, Content Marketing, Email Marketing",
    placement: true,
    type: "Business",
    coursetype: "Flagship"
  },
  {
    name: "UI/UX Design Pro",
    description: "Professional UI/UX design course covering design principles and tools",
    outcome: "Master user interface and user experience design with industry-standard tools",
    duration: "5 months",
    tools: [{ type: "Figma" }, { type: "Adobe XD" }, { type: "Photoshop" }],
    content: "Design Principles, User Research, Prototyping, Design Systems",
    placement: true,
    type: "Design",
    coursetype: "Flagship"
  },
  {
    name: "Python Programming",
    description: "Learn Python programming from basics to advanced concepts",
    outcome: "Gain proficiency in Python programming for various applications",
    duration: "2 months",
    tools: [{ type: "Python" }, { type: "Jupyter" }],
    content: "Python Basics, Data Structures, OOP, File Handling",
    placement: false,
    type: "Programming",
    coursetype: "Short"
  },
  {
    name: "Web Development Fundamentals",
    description: "Learn the basics of web development with HTML, CSS, and JavaScript",
    outcome: "Build responsive websites using modern web technologies",
    duration: "45 days",
    tools: [{ type: "HTML" }, { type: "CSS" }, { type: "JavaScript" }],
    content: "HTML5, CSS3, JavaScript, Responsive Design",
    placement: false,
    type: "Programming",
    coursetype: "Short"
  },
  {
    name: "React Development",
    description: "Advanced React development course for building modern web applications",
    outcome: "Build complex React applications with modern patterns and best practices",
    duration: "3 months",
    tools: [{ type: "React" }, { type: "Redux" }, { type: "TypeScript" }],
    content: "React Hooks, Context API, Redux, TypeScript, Testing",
    placement: true,
    type: "Programming",
    coursetype: "Assistance"
  },
  {
    name: "Graphic Design Essentials",
    description: "Learn graphic design fundamentals with industry-standard tools",
    outcome: "Create professional graphics and designs for various media",
    duration: "2 months",
    tools: [{ type: "Photoshop" }, { type: "Illustrator" }, { type: "InDesign" }],
    content: "Color Theory, Typography, Layout Design, Branding",
    placement: false,
    type: "Design",
    coursetype: "Short"
  }
];

export { coursesList };
