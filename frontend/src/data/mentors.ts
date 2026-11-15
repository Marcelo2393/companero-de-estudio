export interface Mentor {
  id: number
  name: string
  specialty: string
  skills: string[]
  experience: string
  phrase: string
}

// 10 mentores inventados de la carrera de Ciencia de la Computación.
// Cada uno muestra sus habilidades, su experiencia en mentorías y una frase
// amigable pensada para contagiar confianza y ganas de mejorar.
export const mentors: Mentor[] = [
  {
    id: 1,
    name: 'Lucía Ramírez',
    specialty: 'Algoritmos y Estructuras de Datos',
    skills: ['Algoritmos', 'Estructuras de datos', 'Complejidad', 'C++', 'Python'],
    experience: '4 años mentorando en grupos de estudio y olimpiadas de informática.',
    phrase:
      '¡Tranquilo, los algoritmos se dominan con práctica, no con magia! Cada problema que resuelves te hace más fuerte. Vamos uno a uno, lo lograremos juntos. 💪',
  },
  {
    id: 2,
    name: 'Diego Fernández',
    specialty: 'Desarrollo Web Full-Stack',
    skills: ['React', 'TypeScript', 'Node.js', 'FastAPI', 'REST APIs'],
    experience: '5 años guiando a estudiantes en proyectos web reales y hackatones.',
    phrase:
      'Construir cosas que la gente puede usar es lo más divertido de programar. Empezá con algo pequeño y sumale funciones poco a poco. ¡Vos podés! 🚀',
  },
  {
    id: 3,
    name: 'Valentina Quispe',
    specialty: 'Inteligencia Artificial y Machine Learning',
    skills: ['Python', 'Machine Learning', 'Redes neuronales', 'Pandas', 'NumPy'],
    experience: '3 años como mentora en un club de IA universitario.',
    phrase:
      'La IA parece magia, pero es solo matemáticas y curiosidad. No tengas miedo de preguntar lo que no entiendas: de ahí nacen los grandes descubrimientos. ✨',
  },
  {
    id: 4,
    name: 'Mateo Rojas',
    specialty: 'Bases de Datos y SQL',
    skills: ['SQL', 'PostgreSQL', 'Modelado de datos', 'SQLite', 'Optimización'],
    experience: '6 años trabajando y mentorando en bases de datos relacionales.',
    phrase:
      'Una buena base de datos es el corazón de cualquier app. Aprender SQL es como aprender a ordenar tus ideas. Con práctica te volverás imparable. 💾',
  },
  {
    id: 5,
    name: 'Sofía Mendoza',
    specialty: 'Programación Competitiva',
    skills: ['Algoritmos', 'Competitive Programming', 'C++', 'Grafos', 'DP'],
    experience: '2 veces finalista nacional y 3 años mentora de equipos de competición.',
    phrase:
      'Competir no es solo ganar, es crecer. Cada problema que te cuesta te enseña más que diez fáciles. Confía en tu proceso. 🏆',
  },
  {
    id: 6,
    name: 'Andrés Castillo',
    specialty: 'Ciberseguridad',
    skills: ['Seguridad', 'Criptografía', 'Redes', 'Pentesting', 'Linux'],
    experience: '5 años mentorando en seguridad informática y retos CTF.',
    phrase:
      'Proteger sistemas es proteger a las personas. Pensar como atacante te hace mejor defensor. Dale, que cada reto es una puerta nueva. 🔐',
  },
  {
    id: 7,
    name: 'Camila Vargas',
    specialty: 'Desarrollo Móvil',
    skills: ['Flutter', 'Dart', 'React Native', 'UI/UX', 'Firebase'],
    experience: '4 años creando apps y acompañando a estudiantes en sus primeros proyectos móviles.',
    phrase:
      'Hacer una app que cabe en tu mano y llega a miles es hermoso. No importa si al inicio es simple: lo importante es empezar. ¡Manos a la obra! 📱',
  },
  {
    id: 8,
    name: 'Joaquín Flores',
    specialty: 'Sistemas Operativos y DevOps',
    skills: ['Linux', 'Docker', 'CI/CD', 'Bash', 'Cloud'],
    experience: '7 años en infraestructura y mentoría en DevOps.',
    phrase:
      'Detrás de cada app hay un sistema que la sostiene. Entenderlo te da superpoderes. Aprende lo básico a fondo y el resto fluye. 💻',
  },
  {
    id: 9,
    name: 'Mariana Soto',
    specialty: 'Ingeniería de Software y Testing',
    skills: ['Testing', 'QA', 'Metodologías ágiles', 'Git', 'Refactorización'],
    experience: '5 años mentorando en buenas prácticas y calidad de software.',
    phrase:
      'Un código que funciona hoy debe seguir funcionando mañana. Testear no es una molestia, es tranquilidad. Hacelo simple, hacelo bien. 🧪',
  },
  {
    id: 10,
    name: 'Tomás Aguilar',
    specialty: 'Arquitectura de Software y Sistemas Distribuidos',
    skills: ['Arquitectura', 'Microservicios', 'Escalabilidad', 'Distribuidos', 'Patrones'],
    experience: '8 años diseñando sistemas y guiando a juniors hacia el seniority.',
    phrase:
      'Ver el sistema completo es como armar un rompecabezas. Al principio parece mucho, pero cada pieza encaja. Vas más lejos de lo que crees. 🧩',
  },
]
