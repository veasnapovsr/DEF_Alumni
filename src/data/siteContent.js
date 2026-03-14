export const heroStats = [
  { value: '1.2K', label: 'alumni visits' },
  { value: '340', label: 'shared memories' },
  { value: '14', label: 'graduating sets' },
]

const createPortrait = ({ backgroundA, backgroundB, skin, hair, blazer, accent, initials }) => {
  const markup = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 220" role="img" aria-label="${initials} alumni portrait">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${backgroundA}" />
          <stop offset="100%" stop-color="${backgroundB}" />
        </linearGradient>
      </defs>
      <rect width="320" height="220" rx="28" fill="url(#bg)" />
      <circle cx="160" cy="82" r="40" fill="${skin}" />
      <path d="M116 86c0-34 20-56 44-56s44 22 44 56c-14-9-29-13-44-13s-30 4-44 13Z" fill="${hair}" />
      <path d="M102 194c8-40 34-62 58-62s50 22 58 62" fill="${blazer}" />
      <path d="M142 136h36l17 28h-70Z" fill="${accent}" />
      <circle cx="145" cy="82" r="4" fill="#1f1f1f" />
      <circle cx="175" cy="82" r="4" fill="#1f1f1f" />
      <path d="M148 99c8 7 16 7 24 0" fill="none" stroke="#8a4f4a" stroke-width="3" stroke-linecap="round" />
      <text x="22" y="36" font-size="22" font-family="Georgia, serif" fill="rgba(255,255,255,0.86)">DEF</text>
      <text x="22" y="196" font-size="30" font-family="Georgia, serif" fill="rgba(255,255,255,0.92)">${initials}</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(markup)}`
}

export const alumniSlides = [
  {
    name: 'Nadine M.',
    year: 'Class of 2017',
    title: 'Relive the brightest DEF reunion moments in one scroll-stopping showcase.',
    eyebrow: 'Featured alumni memories',
    memory: 'Remembered for theatre week, Paris debates, and reunion selfies.',
    theme: 'Drama Week Classics',
    accent: '#0055a4',
    secondary: '#ef4135',
    image: createPortrait({
      backgroundA: '#0a4fb3',
      backgroundB: '#2c74d8',
      skin: '#d9a27c',
      hair: '#2e1f1a',
      blazer: '#f5f7fb',
      accent: '#d4242f',
      initials: 'NM',
    }),
  },
  {
    name: 'Jean P.',
    year: 'Class of 2019',
    title: 'Bring old classmates back with a homepage that feels like a premium campaign.',
    eyebrow: 'Alumni spotlight campaign',
    memory: 'The voice behind language club events and every class photo joke.',
    theme: 'Language Club Energy',
    accent: '#0c2d63',
    secondary: '#ef4135',
    image: createPortrait({
      backgroundA: '#ffffff',
      backgroundB: '#dfe9fb',
      skin: '#bf815d',
      hair: '#111827',
      blazer: '#123f8f',
      accent: '#e13a45',
      initials: 'JP',
    }),
  },
  {
    name: 'Aissatou R.',
    year: 'Class of 2016',
    title: 'Turn every alumni photo into a full-page highlight that feels alive on arrival.',
    eyebrow: 'Memory wall hero slide',
    memory: 'Known for poetry recitals, bright energy, and keeping friends connected.',
    theme: 'Poetry and Reunion',
    accent: '#ef4135',
    secondary: '#0055a4',
    image: createPortrait({
      backgroundA: '#d72638',
      backgroundB: '#f06a77',
      skin: '#d7a07c',
      hair: '#24130f',
      blazer: '#ffffff',
      accent: '#0a4fb3',
      initials: 'AR',
    }),
  },
  {
    name: 'Blaise K.',
    year: 'Class of 2021',
    title: 'Show DEF like a modern launch page with bold visuals, movement, and stories.',
    eyebrow: 'Department highlight',
    memory: 'Always at the center of excursion albums and department fun days.',
    theme: 'Excursion Day',
    accent: '#0055a4',
    secondary: '#0c2d63',
    image: createPortrait({
      backgroundA: '#0f2f6d',
      backgroundB: '#f3f6fd',
      skin: '#9b6545',
      hair: '#161616',
      blazer: '#d21f30',
      accent: '#ffffff',
      initials: 'BK',
    }),
  },
  {
    name: 'DEF Students',
    year: 'International Day',
    title: 'Add real event photography to the hero so the platform opens with the department community in focus.',
    eyebrow: 'Campus memory highlight',
    memory: 'A group photo from an International Day gathering, with students and faculty together on stage.',
    theme: 'Journee Internationale',
    accent: '#7b1e24',
    secondary: '#1f7a4d',
    image: '/uploads/1773222107424-f09db150-2cc1-426d-ad89-6ef01bea0992.jpg',
  },
]

export const storyHighlights = [
  'Class of 2015',
  'Reunion Day',
  'French Week',
  'Friends Forever',
]

export const moments = [
  {
    title: 'Photo-first sharing',
    description:
      'Every post starts with a picture and a short story, keeping the platform simple and social.',
  },
  {
    title: 'Built for reunions',
    description:
      'Graduation sets, events, and department highlights are organized in a way friends can revisit easily.',
  },
  {
    title: 'Playful identity',
    description:
      'The design borrows from familiar social apps while staying specific to the Department of French community.',
  },
]