// Project dataset — the single source of truth for the carousel and details
// panel. Components receive this as an argument, so migrating to a fetch/CMS
// later touches only the loader, not the UI.
//
// Schema per project:
//   id           {string}   stable unique id
//   slug         {string}   url-safe id (reserved for future deep-links)
//   name         {string}   project name (card + panel heading)
//   tagline      {string}   ONE line, shown on the card
//   tech         {string[]} technology stack
//   status       {string}   e.g. 'Live', 'In progress', 'Archived'
//   overview     {string}   short paragraph (details panel)
//   problem      {string}   the problem it solves (details panel)
//   features     {string[]} key features (details panel list)
//   architecture {string}   one-line/short architecture note (details panel)
//   links        {{ github?: string, demo?: string }}
//   screenshots  {{ src: string, alt: string }[]}  (optional)

export const projects = [
  {
    id: "proj_wordlist_gen_01",
    slug: "parallel-wordlist-generator",
    name: "Parallel Wordlist Generator",
    tagline: "A digital factory that safely makes millions of passwords without crashing the computer.",
    tech: ["Python", "Multiprocessing", "Producer-Consumer Architecture"],
    status: "Live",
    overview: "This tool takes a few base words and mixes them up into millions of combinations. Instead of making the computer struggle to do everything at once, it acts like a smart factory manager. It uses all the computer's brains to generate the words super fast, while keeping a neat, orderly line so the hard drive doesn't get overwhelmed.",
    problem: "Making millions of combinations normally takes forever. When I first tried to make it faster, all the computer's brains fought over who gets to write on the hard drive, causing a massive data traffic jam that almost crashed the system. I needed a way to make it super fast but totally safe.",
    features: [
      "Uses all computer brains (CPU cores) at the same time to work lightning fast.",
      "Uses a safe 'conveyor belt' system so the hard drive never jams.",
      "Has a built-in math limit (stops at 1 billion words) so it never accidentally eats up all your storage space."
    ],
    architecture: "Factory Model: Many fast workers make the items, but only one dedicated person puts them in the box.",
    links: {
      github: "https://github.com/Burhanuddin-2001/Wordlist_Generator"
    },
    screenshots: [] 
  },
  {
    id: "proj_worm_sim_02",
    slug: "worm-behavior-simulator",
    name: "WØRM & The Hunter",
    tagline: "An invisible program that copies itself, and the custom radar I built to catch it.",
    tech: ["Python", "Windows OS APIs", "psutil"],
    status: "Live",
    overview: "I built a harmless digital 'worm' that hides perfectly in the background and copies itself. But because it was completely invisible, even I couldn't stop it easily! So, I had to build a second program—a 'hunter'—that scans the computer's deep memory to safely find the invisible worm and turn it off without breaking anything else.",
    problem: "To defend a computer, you have to know how the bad guys hide. I made a hiding program, but the standard Windows Task Manager couldn't safely stop it without risking my other important work. I had to build my own tracker to hunt it down.",
    features: [
      "Turns completely invisible to the normal computer screen.",
      "Copies itself in the background automatically on a timer.",
      "Includes a custom 'Hunter' tool that scans the computer's deep memory to safely kill the worm."
    ],
    architecture: "Uses Windows tricks to hide, and deep memory scanning to hunt and destroy.",
    links: {
      github: "https://github.com/Burhanuddin-2001/W0RM-simulator"
    },
    screenshots: []
  },
  {
    id: "proj_port_scan_03",
    slug: "lightning-port-scanner",
    name: "Lightning Port Scanner",
    tagline: "Knocking on 65,000 computer doors at the exact same time.",
    tech: ["Python", "Socket API", "I/O Multiplexing"],
    status: "Live",
    overview: "Computers have thousands of invisible 'doors' (ports) that can be open or closed. Checking them one by one takes almost 18 hours. I built a tool that rings every single doorbell at the exact same time and just listens for who answers, finishing the job in a few seconds.",
    problem: "Waiting for a slow, locked computer door to respond takes 1 minute each. With 65,535 doors, that is a 17+ hour wait! I needed a way to stop waiting in line and check everything simultaneously without freezing the computer.",
    features: [
      "Checks all 65,535 computer doors in seconds instead of hours.",
      "Makes the entire scanning process over 4,000 times faster.",
      "Automatically cleans up 'dead' connections so the computer doesn't freeze or run out of memory."
    ],
    architecture: "Leave a note: Instead of knocking and waiting, it drops a note and lets the computer call back when it's ready.",
    links: {
      github: "https://github.com/Burhanuddin-2001/socket-scanner"
    },
    screenshots: []
  }
];