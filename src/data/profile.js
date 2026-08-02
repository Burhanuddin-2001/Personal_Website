// Profile & contact config — content kept out of components so it can be
// edited without touching logic (and later swapped for a CMS/API response).

export const profile = {
  name: 'Burhanuddin',
  title: 'Cybersecurity Engineer',
  intro: 'Building the tools used to compromise systems, so I can engineer the exact countermeasures to stop them.',

  // Circular hero image. Replace with your own (square source works best).
  avatar: {
    src: '/assets/profile.jpg',
    alt: 'Ghost-mode On',
  },

  // Opened in a new tab by the Hero "Resume" button. Drop your PDF here.
  resumeUrl: '/assets/Burhanuddin_Resume.pdf',

  // Shown in the Contact section only (never in the Hero, per product spec).
  socials: {
    github: 'https://github.com/Burhanuddin-2001',
    linkedin: 'https://www.linkedin.com/in/burhanuddin-cyber',
    email: 'burhanuddin122001@gmail.com',
  },
};

// Contact form submission endpoint (third-party service — see README).
// Loaded from VITE_WEB3FORMS_ENDPOINT and VITE_WEB3FORMS_ACCESS_KEY env vars.
// Leaving either empty makes the form fall back to a client-side demo success state.
export const contactConfig = {
  endpoint: import.meta.env.VITE_WEB3FORMS_ENDPOINT || '',
  accessKey: import.meta.env.VITE_WEB3FORMS_ACCESS_KEY || '',
};
