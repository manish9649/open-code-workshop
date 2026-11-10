// Edit organization details here. Leave empty strings until verified.
export const site = {
  name: "Shiv Sewa Welfare Society",
  registrationCountry: "IN",
  donationMethod: "phonepe_qr",
  tagline: "Seva Hi Sankalp, Samaj Hi Parivaar.",
  taglineEn: "Service Is Our Commitment, Society Is Our Family.",
  email: "shivseva1707@gmail.com",
  phone: "+91 9671742116",
  address: "C/o Rakesh Kumar R/o H.No. 225 Near Govt. School, Village Nandnaur, District Sonipat, Haryana",
  mapEmbedUrl: "", // Google Maps embed URL once address is verified
  socials: [
    { label: "Facebook", href: "" },
    { label: "Instagram", href: "" },
    { label: "YouTube", href: "" },
  ],
  paymentsEnabled: false, // set true once Razorpay is configured and verified
  contactFormEnabled: false, // set true once message delivery is configured
};

export const impactStats = [
  { label: "People Supported", value: 5000, suffix: "+" },
  { label: "Children Helped", value: 1200, suffix: "+" },
  { label: "Community Initiatives", value: 45, suffix: "" },
  { label: "Active Volunteers", value: 150, suffix: "+" },
];

export const nav = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/causes", label: "Our Causes" },
  { to: "/gallery", label: "Gallery" },
  { to: "/donate", label: "Donate" },
  { to: "/contact", label: "Contact Us" },
] as const;
