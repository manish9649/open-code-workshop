import education from "@/assets/education.webp";
import food from "@/assets/food.webp";
import community from "@/assets/community.webp";
import kawar from "@/assets/kawar-seva.webp";
import trees from "@/assets/grow-trees.webp";
import clothes from "@/assets/clothes-distribution.webp";

export type InitiativeDetail = {
  hindiName: string;
  heading: string;
  features: { title: string; text: string; icon: "water" | "food" | "hands" | "tree" | "leaf" | "users" | "shirt" | "winter" | "heart" }[];
  extra?: { title: string; items: string[]; steps?: boolean };
  supportLabel: string;
  volunteerLabel?: string;
  closing: string;
};

export type Cause = {
  id: string;
  title: string;
  short: string;
  image: string;
  long: string;
  points: string[];
  detail?: InitiativeDetail;
};

// Marked as proposed initiatives until confirmed by the organization.
export const causes: Cause[] = [
  {
    id: "education",
    title: "Education for All",
    short: "Supporting educational opportunities and learning resources for children.",
    image: education,
    long: "Every child deserves the chance to learn. This initiative aims to help underprivileged children access learning opportunities so they can build confident, independent futures.",
    points: ["Books and notebooks", "School supplies and stationery", "Learning resources", "Educational assistance"],
  },
  {
    id: "food",
    title: "Food and Essential Support",
    short: "Helping people and families access essential supplies.",
    image: food,
    long: "No family should go without the basics. Contributions could help provide food and essential supplies to individuals and families facing hardship, offering relief and dignity in difficult times.",
    points: ["Food rations for families", "Essential daily supplies", "Support during hardship", "Care for the elderly"],
  },
  {
    id: "community",
    title: "Community Welfare",
    short: "Supporting community wellbeing and local social welfare initiatives.",
    image: community,
    long: "Strong communities lift everyone. This initiative focuses on community wellbeing, awareness and local welfare efforts shaped together with the people we serve.",
    points: ["Community wellbeing activities", "Awareness programs", "Local welfare initiatives", "Volunteer engagement"],
  },
  {
    id: "kawar-yatra-seva",
    title: "Kawar Yatra Seva",
    short: "Serving pilgrims with drinking water, refreshments, and compassionate volunteer support.",
    image: kawar,
    long: "Shiv Sewa Welfare Society believes in serving humanity with devotion and compassion. Through Kawar Yatra Seva, we aim to support pilgrims and encourage the spirit of selfless service.",
    points: ["जल सेवा", "भोजन सेवा", "सेवा सहयोग"],
    detail: {
      hindiName: "सेवा और श्रद्धा",
      heading: "सेवा, श्रद्धा और समर्पण",
      features: [
        { title: "जल सेवा", text: "Drinking water assistance for pilgrims.", icon: "water" },
        { title: "भोजन सेवा", text: "Food distribution and refreshments.", icon: "food" },
        { title: "सेवा सहयोग", text: "Volunteer support and assistance for pilgrims.", icon: "hands" },
      ],
      supportLabel: "Support Kawar Yatra Seva",
      closing: "हर हर महादेव – मानव सेवा ही महादेव की सेवा है।",
    },
  },
  {
    id: "grow-trees",
    title: "Grow Trees",
    short: "Nurturing a greener tomorrow through tree plantation and community care for nature.",
    image: trees,
    long: "Every tree represents hope for a greener tomorrow. Shiv Sewa Welfare Society encourages communities to protect nature, plant trees, and create a cleaner environment for future generations.",
    points: ["Plant a Tree", "Save Nature", "Community Green Drive"],
    detail: {
      hindiName: "हरियाली अभियान",
      heading: "आज एक पौधा, कल एक बेहतर भविष्य",
      features: [
        { title: "Plant a Tree", text: "Encourage tree plantation and sapling distribution.", icon: "tree" },
        { title: "Save Nature", text: "Spread awareness about environmental protection.", icon: "leaf" },
        { title: "Community Green Drive", text: "Inspire people to participate in local plantation initiatives.", icon: "users" },
      ],
      extra: { title: "Why Trees Matter", items: ["Cleaner air", "Biodiversity", "Natural shade", "A healthier environment"] },
      supportLabel: "Support Green Initiatives",
      volunteerLabel: "Become a Volunteer",
      closing: "पेड़ लगाएं, जीवन बचाएं — हरियाली अपनाएं।",
    },
  },
  {
    id: "clothes-distribution",
    title: "Clothes Distribution",
    short: "Sharing clean clothing and warm essentials with care, comfort, and dignity.",
    image: clothes,
    long: "A simple act of kindness can bring warmth, comfort, and dignity. Shiv Sewa Welfare Society encourages clothing donations and community support to help people access essential garments with respect.",
    points: ["Donate Clothes", "Winter Clothing Support", "Share with Dignity"],
    detail: {
      hindiName: "वस्त्र सेवा अभियान",
      heading: "आपका दान, किसी के चेहरे पर मुस्कान",
      features: [
        { title: "Donate Clothes", text: "Donate clean, wearable clothes in good condition.", icon: "shirt" },
        { title: "Winter Clothing Support", text: "Potential distribution of sweaters, jackets, blankets, and other warm essentials.", icon: "winter" },
        { title: "Share with Dignity", text: "Promote respectful distribution based on community needs.", icon: "heart" },
      ],
      extra: { title: "How You Can Help", steps: true, items: ["Collect clean, usable clothing.", "Coordinate donations with the organization.", "Help distribute items responsibly to people in need."] },
      supportLabel: "Contribute to This Cause",
      volunteerLabel: "Volunteer with Us",
      closing: "पुराने कपड़े, नई उम्मीद — आइए मिलकर खुशियां बांटें।",
    },
  },
];

export const donationCauseOptions = ["Education", ...causes.slice(1).map((cause) => cause.title), "General Fund"];
