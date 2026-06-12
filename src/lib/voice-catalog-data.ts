export type Gender = "male" | "female" | "nonbinary";

export interface Voice {
  tag: string;
  slug: string;
  gender: Gender;
  title: string;
  src: string;
}

export interface Narrator {
  name: string;
  slug: string;
  src: string;
}

function buildVoice(gender: Gender, tag: string): Voice {
  const slug = tag.replace(/ /g, "-");
  const title = tag
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { tag, slug, gender, title, src: `/audio/${gender}/${slug}.mp3` };
}

const female: string[] = [
  "female calm controlled",
  "female calm relaxing",
  "female child gentle",
  "female cynical monotone",
  "female deep controlled",
  "female ethereal light",
  "female gentle grounded",
  "female harsh commanding",
  "female melodic bright",
  "female playful youthful",
  "female posh british",
  "female scottish old",
  "female sly smooth",
  "female soft flirtatious",
  "female warm friendly",
  "female warm soft",
  "female young friendly british",
];

const male: string[] = [
  "male ancient powerful",
  "male australian young casual",
  "male baritone warm",
  "male british refined",
  "male brute commanding",
  "male calm steady",
  "male child calm",
  "male child expressive",
  "male commanding blunt",
  "male commanding gruff narrator",
  "male commanding intense",
  "male commanding resonant british",
  "male confident casual",
  "male confident energetic",
  "male confident warm",
  "male deep accent",
  "male deep calculating",
  "male deep controlled",
  "male deep drywitted",
  "male deep gravelly british",
  "male deep raspy",
  "male elderly british",
  "male elderly refined",
  "male gentle soothing",
  "male goblin chaotic",
  "male gravelly elderly",
  "male grounded conversational",
  "male laconic calm",
  "male monster growly",
  "male monster slow booming",
  "male old wise",
  "male sinister ominous",
  "male sly manipulative",
  "male southern gritty",
  "male steady approachable",
  "male young charismatic",
];

const nonbinary: string[] = [
  "nonbinary confident grounded",
  "nonbinary melodic calm",
];

const narratorNames: string[] = [
  "Aurora",
  "Mesa",
  "Mirage",
  "Nebula",
  "Reverie",
  "Rune",
  "Solstice",
  "Stellar",
];

export const voices: Voice[] = [
  ...female.map((t) => buildVoice("female", t)),
  ...male.map((t) => buildVoice("male", t)),
  ...nonbinary.map((t) => buildVoice("nonbinary", t)),
];

export const narrators: Narrator[] = narratorNames.map((name) => {
  const slug = "narrator-" + name.toLowerCase();
  return { name, slug, src: `/audio/narrator/${slug}.mp3` };
});
