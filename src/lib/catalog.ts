export type CatalogChannel = {
  id: string;
  handle: string;
  title: string;
  thumbnail: string;
  category: "Science" | "Explainers" | "Tech" | "Design";
  blurb: string;
};

export const CATALOG: CatalogChannel[] = [
  {
    id: "UCHnyfMqiRRG1u-2MsSQLbXA",
    handle: "veritasium",
    title: "Veritasium",
    thumbnail:
      "https://yt3.googleusercontent.com/7vCbvtCqtjQ3YLgsJt7Y952MQV1sBvhllSCSxHP8_sVZdcPCBrITfhkN2RdyCuwPnsByq-1GoA=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "Experiments that change how you see the world",
  },
  {
    id: "UCYO_jab_esuFRV4b17AJtAw",
    handle: "3blue1brown",
    title: "3Blue1Brown",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_nFzZFPLxPZRHcE3SSwzdrbuWqfoWYwLAu0_2iO6blQYAU=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "Math with a point of view",
  },
  {
    id: "UCsXVk37bltHxD1rDPwtNM8Q",
    handle: "kurzgesagt",
    title: "Kurzgesagt",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_n1Ribd7LwdP_qKtqWL3ZDfIgv9M1d6g78VwpHGXVR2Ir4=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "Big ideas, in a nutshell",
  },
  {
    id: "UC6nSFpj9HTCZ5t-N3Rm3-HA",
    handle: "vsauce",
    title: "Vsauce",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_mpYedipdXUXCKkwjQEeFrepFlDHZ0LiczqWeKyG0YmJvA=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "Questions you did not know you had",
  },
  {
    id: "UCUHW94eEFW7hkUMVaZz4eDg",
    handle: "minutephysics",
    title: "minutephysics",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_mNlRy8Ablr-4VtAT6eDe7ED-3tfNFZ0FwhEYdtc6B_oQ=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "Physics, quickly and clearly",
  },
  {
    id: "UCoxcjq-8xIDTYp3uz647V5A",
    handle: "numberphile",
    title: "Numberphile",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_nmbQSAGKk1OZCBBf_sPJqLoFfYOVDWRDzALocBjGQtHeI=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "Numbers, and the people who love them",
  },
  {
    id: "UC6107grRI4m0o2-emgoDnAA",
    handle: "smartereveryday",
    title: "SmarterEveryDay",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_l59Ewmp0DHZBRWbY9dVqjd2_mWwvrn8ad0bJfmdbMRYcA=s900-c-k-c0x00ffffff-no-rj",
    category: "Science",
    blurb: "High-speed curiosity",
  },
  {
    id: "UC2C_jShtL725hvbm1arSV9w",
    handle: "cgpgrey",
    title: "CGP Grey",
    thumbnail:
      "https://yt3.googleusercontent.com/ytc/AIdro_nxrDGcxMGo8yKf2_Dw0eaGEWj39IAIdZQjAuz-_mBHjUI=s900-c-k-c0x00ffffff-no-rj",
    category: "Explainers",
    blurb: "Systems, maps, and how the world works",
  },
  {
    id: "UCBJycsmduvYEL83R_U4JriQ",
    handle: "mkbhd",
    title: "Marques Brownlee",
    thumbnail:
      "https://yt3.googleusercontent.com/qu4TmIaYUlS41-dJ9gZ7DUR3nilvmB5_11i6OKSdvNnBNiyOusZP1bMN6ICnuxtjFBb6ioKgRQ=s900-c-k-c0x00ffffff-no-rj",
    category: "Tech",
    blurb: "Tech, reviewed with care",
  },
  {
    id: "UCsBjURrPoezykLs9EqgamOA",
    handle: "fireship",
    title: "Fireship",
    thumbnail:
      "https://yt3.googleusercontent.com/3fPNbkf_xPyCleq77ZhcxyeorY97NtMHVNUbaAON_RBDH9ydL4hJkjxC8x_4mpuopkB8oI7Ct6Y=s900-c-k-c0x00ffffff-no-rj",
    category: "Tech",
    blurb: "Code, fast and opinionated",
  },
  {
    id: "UCXuqSBlHAE6Xw-yeJA0Tunw",
    handle: "linustechtips",
    title: "Linus Tech Tips",
    thumbnail:
      "https://yt3.googleusercontent.com/gnvYLhXy8FAlPXZ2RTrkrgj-5kyt0vdE2FUGVOiKGdEZIa-wN5A-7nwZBlWJLzUMmoh1NWAU=s900-c-k-c0x00ffffff-no-rj",
    category: "Tech",
    blurb: "Hardware, labs, and teardowns",
  },
  {
    id: "UCddiUEpeqJcYeBxX1IVBKvQ",
    handle: "theverge",
    title: "The Verge",
    thumbnail:
      "https://yt3.googleusercontent.com/ZIj_dq7beCkAkhufNqCid_SjWW4mkv4tqIDtv7_AAKzWdhBWI-rpsRXYXB9X3mB0s0zNzNtYdQ=s900-c-k-c0x00ffffff-no-rj",
    category: "Tech",
    blurb: "The intersection of tech and culture",
  },
  {
    id: "UCbRP3c757lWg9M-U7TyEkXA",
    handle: "t3dotgg",
    title: "Theo — t3.gg",
    thumbnail:
      "https://yt3.googleusercontent.com/Y6jut5A-dhWRlv7W81kGxVFPtZGjZN97IhBP75uLnx2AVV7ZEJUUUxBKHlFw9GcwILxkz1E_cLc=s900-c-k-c0x00ffffff-no-rj",
    category: "Tech",
    blurb: "Web dev, honestly",
  },
  {
    id: "UCVyRiMvfUNMA1UPlDPzG5Ow",
    handle: "designcourse",
    title: "DesignCourse",
    thumbnail:
      "https://yt3.googleusercontent.com/ieTt1p2twEf4cz0vhOtB-0UXPN4vk9-8HM8OqxcX8sRU3nm5Di8sohyFOvxR3M-pN_bo4rnL=s900-c-k-c0x00ffffff-no-rj",
    category: "Design",
    blurb: "UI craft and critique",
  },
];

export const CATALOG_CATEGORIES = [
  "Science",
  "Explainers",
  "Tech",
  "Design",
] as const;
