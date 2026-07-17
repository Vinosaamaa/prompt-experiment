# Prompt — Jack — 3D Creator portfolio

- **Folder:** `jack-3d-portfolio/`
- **Status:** Original experiment prompt (saved from chat)
- **Stack requested:** React, TypeScript, Tailwind CSS, Framer Motion, Lucide React; dark theme; Kanit font

---

Build a 3D Creator portfolio landing page for "Jack" using React, TypeScript, Tailwind CSS, Framer Motion, and Lucide React. The page has a dark theme (#0C0C0C background) with the font Kanit (Google Fonts, weights 300-900). The page title is "Jack -- 3D Creator".

## GLOBAL STYLES

Background: #0C0C0C on html, body, #root, and the main wrapper  
Font family: 'Kanit', sans-serif  
Global reset: box-sizing border-box, margin 0, padding 0  
CSS class `.hero-heading`: gradient text using `background: linear-gradient(180deg, #646973 0%, #BBCCD7 100%)` with `-webkit-background-clip: text` and `-webkit-text-fill-color: transparent`  
Main wrapper has `overflowX: 'clip'`

## SECTION ORDER

1. HeroSection  
2. MarqueeSection  
3. AboutSection  
4. ServicesSection  
5. ProjectsSection  

## 1. HERO SECTION

Full viewport height (`h-screen`), flex column layout with `overflowX: clip`.

**Navbar:** Horizontal nav bar with 4 links -- "About", "Price", "Projects", "Contact" -- evenly spaced with `justify-between`. Text color `#D7E2EA`, font-medium, uppercase, tracking-wider. Sizes: `text-sm md:text-lg lg:text-[1.4rem]`. Padding: `px-6 md:px-10 pt-6 md:pt-8`. Hover: opacity 70% with 200ms transition.

**Hero Heading:** Massive h1 with text "Hi, i'm jack" (lowercase "i", curly apostrophe via `&apos;`). Uses the `.hero-heading` gradient text class. Font-black, uppercase, tracking-tight, leading-none, whitespace-nowrap, w-full. Font sizes: `text-[14vw] sm:text-[15vw] md:text-[16vw] lg:text-[17.5vw]`. Margin top: `mt-6 sm:mt-4 md:-mt-5`. Wrapped in overflow-hidden container.

**Bottom bar:** Flexbox `justify-between items-end` with `pb-7 sm:pb-8 md:pb-10`:

- Left: paragraph text "a 3d creator driven by crafting striking and unforgettable projects", color `#D7E2EA`, font-light, uppercase, tracking-wide, leading-snug. Font size: `clamp(0.75rem, 1.4vw, 1.5rem)`. Max-width: `max-w-[160px] sm:max-w-[220px] md:max-w-[260px]`.
- Right: ContactButton component

**Hero Portrait:** Centered absolutely. Uses a Magnet component (mouse-following magnetic effect) wrapping an image. Image URL: `https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png`. Magnet settings: padding 150, strength 3, activeTransition `"transform 0.3s ease-out"`, inactiveTransition `"transform 0.6s ease-in-out"`. Positioning: absolute `left-1/2 -translate-x-1/2 z-10`. Width: `w-[280px] sm:w-[360px] md:w-[440px] lg:w-[520px]`. On mobile: `top-1/2 -translate-y-1/2`. On sm+: `sm:top-auto sm:translate-y-0 sm:bottom-0`.

**FadeIn animations:** Navbar fades in with delay 0, y -20. Heading: delay 0.15, y 40. Left text: delay 0.35, y 20. Contact button: delay 0.5, y 20. Portrait: delay 0.6, y 30.

## 2. MARQUEE SECTION

Two rows of images that scroll horizontally based on page scroll position. Background `#0C0C0C`. Padding: `pt-24 sm:pt-32 md:pt-40 pb-10`.

21 GIF images from motionsites.ai (exact URLs in the original brief / see `jack-3d-portfolio/src/data.ts`).

- Row 1: first 11 images, tripled for seamless scrolling. Moves RIGHT on scroll (`translateX(offset - 200)`).
- Row 2: remaining 10 images, tripled. Moves LEFT on scroll (`translateX(-(offset - 200))`).
- Scroll offset: `(window.scrollY - sectionTop + window.innerHeight) * 0.3`
- Each image tile: 420px × 270px, rounded-2xl, object-cover, lazy loaded.
- Gap between tiles: `gap-3`. Gap between rows: `gap-3`.
- Uses `willChange: 'transform'`. Scroll listener is passive.

## 3. ABOUT SECTION

Full-height centered section with `min-h-screen`, padding `px-5 sm:px-8 md:px-10 py-20`.

Four decorative 3D images positioned absolutely in corners (moon, 3D object, lego, group) with specified URLs, sizes, positions, and FadeIn delays from the original brief.

Heading: "About me" using `.hero-heading`, font-black, uppercase, centered, `clamp(3rem, 12vw, 160px)`.

Animated paragraph (character-by-character scroll opacity):  
"With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!"  
Color `#D7E2EA`, font-medium, centered, leading-relaxed, max-w-[560px], font size `clamp(1rem, 2vw, 1.35rem)`. Scroll offset `['start 0.8', 'end 0.2']`.

Contact button below. Gaps as specified in the brief.

## 4. SERVICES SECTION

White background (`#FFFFFF`), rounded top corners `rounded-t-[40px] sm:rounded-t-[50px] md:rounded-t-[60px]`. Padding `px-5 sm:px-8 md:px-10 py-20 sm:py-24 md:py-32`.

Heading: "Services" in `#0C0C0C`, font-black, uppercase, centered, `clamp(3rem, 12vw, 160px)`.

5 service items:

01 - 3D Modeling  
02 - Rendering  
03 - Motion Design  
04 - Branding  
05 - Web Design  

(Full descriptions in original brief / `jack-3d-portfolio/src/data.ts`.)

Layout: number left, name + description right; borders `rgba(12, 12, 12, 0.15)`; staggered FadeIn `i * 0.1`.

## 5. PROJECTS SECTION

Dark background `#0C0C0C`, rounded top corners, pulled up with `-mt-10 sm:-mt-12 md:-mt-14`, z-10.

Heading: "Project" (singular) using `.hero-heading`.

3 sticky-stacking project cards that scale down as you scroll (Framer Motion `useScroll` / `useTransform`). Each card sticky inside `h-[85vh]`.

`targetScale = 1 - (totalCards - 1 - index) * 0.03`. Offset `top: ${index * 28}px`.

Projects:

1. Nextlevel Studio (Client)  
2. Aura Brand Identity (Personal)  
3. Solaris Digital (Client)  

(Image URLs in original brief / `jack-3d-portfolio/src/data.ts`.)

## REUSABLE COMPONENTS

- **ContactButton** — gradient pill, white outline, "Contact Me"
- **LiveProjectButton** — ghost outline pill, "Live Project"
- **FadeIn** — `whileInView`, viewport `{ once: true, margin: "50px", amount: 0 }`, easing `[0.25, 0.1, 0.25, 1]`, uses `motion.create()` for dynamic element types
- **Magnet** — mouse-following magnetic hover
- **AnimatedText** — character scroll-reveal opacity 0.2 → 1

## KEY DEPENDENCIES

- react, react-dom (^18.3.1)
- framer-motion (^12.38.0)
- lucide-react (^0.344.0)
- tailwindcss (^3.4.1)
- vite, typescript

## RESPONSIVE

Tailwind defaults (sm 640 / md 768 / lg 1024), mobile-first, heavy use of `clamp()` for fluid type.

---

### Full verbatim marquee + project image URL lists

See the chat transcript and implementation in `jack-3d-portfolio/src/data.ts` for the complete exact URL lists (21 marquee GIFs + CloudFront/higgs project images) as specified in the original prompt.


---

## Exact asset URLs (from implementation / original brief)

```ts
export const MARQUEE_GIFS = [
  'https://motionsites.ai/assets/hero-space-voyage-preview-eECLH3Yc.gif',
  'https://motionsites.ai/assets/hero-codenest-preview-Cgppc2qV.gif',
  'https://motionsites.ai/assets/hero-vex-ventures-preview-BczMFIiw.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-v2-preview-DjvxjG3C.gif',
  'https://motionsites.ai/assets/hero-asme-preview-B_nGDnTP.gif',
  'https://motionsites.ai/assets/hero-transform-data-preview-Cx5OU29N.gif',
  'https://motionsites.ai/assets/hero-vitara-preview-Cjz2QYyU.gif',
  'https://motionsites.ai/assets/hero-terra-preview-BFjrCr7T.gif',
  'https://motionsites.ai/assets/hero-skyelite-preview-DHaZIgUv.gif',
  'https://motionsites.ai/assets/hero-aethera-preview-DknSlcTa.gif',
  'https://motionsites.ai/assets/hero-designpro-preview-D8c5_een.gif',
  'https://motionsites.ai/assets/hero-stellar-ai-preview-D3HL6bw1.gif',
  'https://motionsites.ai/assets/hero-xportfolio-preview-D4A8maiC.gif',
  'https://motionsites.ai/assets/hero-orbit-web3-preview-BXt4OttD.gif',
  'https://motionsites.ai/assets/hero-nexora-preview-cx5HmUgo.gif',
  'https://motionsites.ai/assets/hero-evr-ventures-preview-DZxeVFEX.gif',
  'https://motionsites.ai/assets/hero-planet-orbit-preview-DWAP8Z1P.gif',
  'https://motionsites.ai/assets/hero-new-era-preview-CocuDUm9.gif',
  'https://motionsites.ai/assets/hero-wealth-preview-B70idl_u.gif',
  'https://motionsites.ai/assets/hero-luminex-preview-CxOP7ce6.gif',
  'https://motionsites.ai/assets/hero-celestia-preview-0yO3jXO8.gif',
] as const

export const SERVICES = [
  {
    num: '01',
    name: '3D Modeling',
    description:
      'Creation of detailed objects, characters, or environments tailored to specific client needs, ideal for games, products, and visualizations.',
  },
  {
    num: '02',
    name: 'Rendering',
    description:
      'High-quality, photorealistic renders that showcase designs with custom lighting, textures, and materials to bring concepts to life.',
  },
  {
    num: '03',
    name: 'Motion Design',
    description:
      'Dynamic animations and motion graphics that add energy and storytelling to brands, products, and digital experiences.',
  },
  {
    num: '04',
    name: 'Branding',
    description:
      'Crafting cohesive visual identities -- from logos to full brand systems -- that communicate a clear and memorable presence.',
  },
  {
    num: '05',
    name: 'Web Design',
    description:
      'Designing clean, modern, and conversion-focused websites with attention to layout, typography, and user experience.',
  },
] as const

export type Project = {
  num: string
  name: string
  category: string
  images: {
    col1Top: string
    col1Bottom: string
    col2: string
  }
}

export const PROJECTS: Project[] = [
  {
    num: '01',
    name: 'Nextlevel Studio',
    category: 'Client',
    images: {
      col1Top:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055344_5eff02e0-87a5-41ce-b64f-eb08da8f33db.png&w=1280&q=85',
      col1Bottom:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055431_11d841fd-8b41-46a5-82e4-b04f2407a7d8.png&w=1280&q=85',
      col2:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055451_e317bf2d-28d4-48cc-86b0-6f72f25b6327.png&w=1280&q=85',
    },
  },
  {
    num: '02',
    name: 'Aura Brand Identity',
    category: 'Personal',
    images: {
      col1Top:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055654_911201c5-36d9-4bc6-bac7-331adfce159f.png&w=1280&q=85',
      col1Bottom:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055723_5ceda0b8-d9c2-4665-b2e3-83ba19ba76d1.png&w=1280&q=85',
      col2:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055753_adc5dcbd-a8e6-49c0-b43a-9b030d835cea.png&w=1280&q=85',
    },
  },
  {
    num: '03',
    name: 'Solaris Digital',
    category: 'Client',
    images: {
      col1Top:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055759_963cfb0b-4bd1-4b0f-9d0a-09bd6cf95b2f.png&w=1280&q=85',
      col1Bottom:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_060108_438f781a-9846-4dcc-89ab-c4e6cb830f5b.png&w=1280&q=85',
      col2:
        'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260412_055818_9d062121-ad7e-46b9-999a-1a6a902ef1ee.png&w=1280&q=85',
    },
  },
]

export const PORTRAIT_URL =
  'https://shrug-person-78902957.figma.site/_components/v2/d24c01ad3a56fc65e942a1f501eb73db42d7cf9a/Rectangle_40443.81459862.png'

export const ABOUT_DECOR = {
  moon: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/moon_icon.11395d36.png',
  object:
    'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/p59_1.4659672e.png',
  lego: 'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/lego_icon-1.703bb594.png',
  group:
    'https://shrug-person-78902957.figma.site/_components/v2/ebb2b8f25d8e24d5f0a5ca8af4c950de81aa2fd7/Group_134-1.2e04f3ce.png',
} as const

export const ABOUT_TEXT =
  "With more than five years of experience in design, i focus on branding, web design, and user experience, i truly enjoy working with businesses that aim to stand out and present their best image. Let's build something incredible together!"

```
