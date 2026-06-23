---
name: Sovereign Trust Identity
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#404942'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#707971'
  outline-variant: '#c0c9c0'
  surface-tint: '#306949'
  primary: '#00341c'
  on-primary: '#ffffff'
  primary-container: '#0d4c2e'
  on-primary-container: '#80bc95'
  inverse-primary: '#97d4ac'
  secondary: '#795900'
  on-secondary: '#ffffff'
  secondary-container: '#ffc641'
  on-secondary-container: '#715300'
  tertiary: '#2c2c29'
  on-tertiary: '#ffffff'
  tertiary-container: '#42423f'
  on-tertiary-container: '#afaeaa'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b3f1c7'
  primary-fixed-dim: '#97d4ac'
  on-primary-fixed: '#002110'
  on-primary-fixed-variant: '#145132'
  secondary-fixed: '#ffdfa0'
  secondary-fixed-dim: '#f6be39'
  on-secondary-fixed: '#261a00'
  on-secondary-fixed-variant: '#5c4300'
  tertiary-fixed: '#e4e2dd'
  tertiary-fixed-dim: '#c8c6c2'
  on-tertiary-fixed: '#1b1c19'
  on-tertiary-fixed-variant: '#474744'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
    letterSpacing: 0.05em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The design system is engineered to evoke absolute institutional trust, security, and administrative efficiency. It targets Nigerian citizens, financial institutions, and government agencies, balancing a "GovTech" authority with a modern "FinTech" ease of use. 

The visual style is **Corporate / Modern** with a focus on high legibility and structured hierarchy. It utilizes a clean, spacious interface that avoids unnecessary ornamentation, ensuring that the critical task of identity verification feels transparent and foolproof. Subtle cultural nods are integrated through the color palette and micro-patterns, grounding the digital experience in a local context without sacrificing international design standards.

## Colors
The palette is rooted in the Nigerian national identity, using **Deep Forest Green** as the primary anchor to signify stability and growth. **Warm Gold** is used sparingly as an accent for calls-to-action and highlights, providing a premium feel. 

The background utilizes an **Off-white** tone to reduce eye strain compared to pure white, while **Dark Charcoal** ensures high-contrast accessibility for all text elements. Status colors are vibrant and industry-standard to provide immediate visual feedback during multi-step verification processes.

## Typography
The typographic system uses a dual-font approach to differentiate between narrative content and critical data. 
- **Outfit** is used for headings to provide a modern, welcoming, yet professional tone.
- **Inter** handles all body copy and UI labels, chosen for its exceptional legibility on mobile screens.
- **JetBrains Mono** is strictly reserved for sensitive data strings like NIN, BVN, and Account Numbers. This ensures each digit is distinct and vertically aligned, reducing user error during manual verification or entry.

## Layout & Spacing
This design system follows a **fluid grid** model optimized for mobile-first delivery. 
- **Mobile:** 4-column grid with 20px side margins. 
- **Desktop:** 12-column grid with a max-width of 1140px. 

Spacing follows a 4px baseline shift, but primarily relies on 8px increments (8, 16, 24, 32, 48) to create a rhythmic vertical flow. Components like identity cards use `md` (16px) internal padding, while section groupings use `xl` (32px) to maintain a sense of organized, professional "breathing room."

## Elevation & Depth
Depth is conveyed through **Tonal Layers** and **Ambient Shadows**. 
- **Level 0 (Background):** #F7F5F0.
- **Level 1 (Cards/Surface):** Pure White (#FFFFFF) with a very soft, diffused 15% opacity shadow (0px 4px 12px) tinted with the Primary color to maintain brand cohesion.
- **Level 2 (Modals/Popovers):** Higher elevation with a 25% opacity shadow (0px 8px 24px).

Avoid heavy black shadows; instead, use "Forest Green" tinted shadows on the Off-white background to create a sophisticated, modern lift.

## Shapes
The shape language is defined by a consistent **12px (0.75rem)** radius for all primary containers, including buttons, input fields, and data cards. This specific roundedness (defined as `rounded-lg` in this system) strikes a balance between the friendliness of a consumer app and the structural integrity of a government portal. 

Smaller elements like status badges use a fully rounded "pill" shape to distinguish them from interactive buttons.

## Components
- **Buttons:** Primary buttons use the Deep Forest Green background with White text. Secondary buttons use a Forest Green outline with a subtle Gold hover state. Minimum height is 48px for mobile tap targets.
- **Identity Cards:** Use a White surface. The top-right corner features a subtle, low-opacity (5%) watermark of the Nigerian Coat of Arms or Flag silhouette to reinforce institutional context.
- **Input Fields:** 12px border radius, 1px border (#E5E7EB). On focus, the border transitions to Primary Green with a 2px width.
- **Bottom Navigation:** A mobile-exclusive persistent bar with a blurred background (Glassmorphism effect) to allow content to peek through while maintaining legibility.
- **Data Displays:** Use a "Copy-to-Clipboard" icon next to all monospaced NIN/BVN strings for utility.
- **Status Badges:** Small, high-contrast labels using the status colors defined in the palette, paired with a 20% opacity background of the same hue.