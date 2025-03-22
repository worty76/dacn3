import {
  Open_Sans,
  Pinyon_Script,
  Playfair_Display,
  Roboto,
} from "next/font/google";

export const roboto = Roboto({
  weight: ["500", "900", "700", "400"],
  subsets: ["vietnamese"],
  variable: "--font-roboto",
});

export const openSans = Open_Sans({
  weight: ["400", "600", "700"],
  subsets: ["vietnamese"],
  variable: "--font-open-sans",
});

export const playFair = Playfair_Display({
  weight: ["400", "500", "900", "700"],
  subsets: ["vietnamese"],
  variable: "--font-playfair",
});

export const pinyonScript = Pinyon_Script({
  weight: ["400"],
  subsets: ["vietnamese"],
  variable: "--font-pinyon-script",
});
