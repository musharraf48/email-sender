const REACT_DEVELOPER_BODY = `Name: Musharraf Ansari
Experience: 2.5 years
Skills: React Native, React.js, Next.js, TypeScript, Redux, Context API, Zustand, Tailwind CSS, ShadCN, Material UI, REST APIs, Git, Expo, Websocket, Vite, Turbopack, JWT, Axios, React Query, Vercel, Netlify, socket io, postman
Email: musharraf.code@gmail.com
Phone: +91 7987942548
LinkedIn: https://www.linkedin.com/in/musharraf-ansari-764954250/
Notice Period: 0 days (Immediate Joiner)
Preferred Location: Remote / Hybrid / Open to relocation
Resume: Attached with this message`;

const REACT_NATIVE_BODY = `Name: Musharraf Ansari
Experience: 2.5 years
Skills: React Native, React.js, Next.js, TypeScript, Redux, Context API, Zustand, Tailwind CSS, Nativewind, Nativebase, Gluestack, REST APIs, GraphQL, Git, Expo, JWT, Axios, Firebase, Xcode, Android Studio, EAS, React Navigation, Figma
Email: musharraf.code@gmail.com
Phone: +91 7987942548
LinkedIn: https://www.linkedin.com/in/musharraf-ansari-764954250/
Notice Period: 0 days (Immediate Joiner)
Resume: Attached with this email`;

const WEB_DEVELOPER_BODY = `Name: Musharraf Ansari
Experience: 2.5 years
Skills: HTML, CSS, JavaScript, TypeScript, React.js, Next.js, Node.js, REST APIs, Git, Tailwind CSS, Responsive Design, Vercel, Netlify, JWT, Axios, MongoDB basics, PostgreSQL basics
Email: musharraf.code@gmail.com
Phone: +91 7987942548
LinkedIn: https://www.linkedin.com/in/musharraf-ansari-764954250/
Notice Period: 0 days (Immediate Joiner)
Preferred Location: Remote / Hybrid / Open to relocation
Resume: Attached with this message`;

export const JOB_TYPES = [
  'React Developer',
  'React Native Developer',
  'Frontend Developer',
  'Web Developer',
] as const;

export type JobType = (typeof JOB_TYPES)[number];

export const APPLICATION_STATUSES = [
  'applied',
  'replied',
  'interview',
  'offer',
  'rejected',
  'expired',
  'withdrawn',
  'hired',
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

export const templates: Record<JobType, { subject: string; body: string }> = {
  'React Developer': {
    subject: 'Application for React Developer',
    body: REACT_DEVELOPER_BODY,
  },
  'React Native Developer': {
    subject: 'Application for React Native Developer',
    body: REACT_NATIVE_BODY,
  },
  'Frontend Developer': {
    subject: 'Application for Frontend Developer',
    body: REACT_DEVELOPER_BODY,
  },
  'Web Developer': {
    subject: 'Application for Web Developer',
    body: WEB_DEVELOPER_BODY,
  },
};

export const isValidJobType = (jobType: string): jobType is JobType => {
  return JOB_TYPES.includes(jobType as JobType);
};
