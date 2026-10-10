# Content, design, mobile and verification

## Content rules
- All copy in `src/content/*`. The About is the person's own words; edit punctuation only.
- No em dashes or en dashes anywhere (grep `—` and `–`). Ranges use "-" or "to"; titles use "·".
- Metrics must be true and impressive in context (promotions or scope beat vanity counts like raw ticket numbers).
- Project names: short and plain, two or three words. Explain what it is in one plain sentence.
- Confidentiality: no client, carrier, partner or internal feature names, no ticket IDs or coworker names. Describe problem → what was built → impact, focused on skills.
- Current-role text describes the person's role, not the company's marketing.
- No personal email on the page or in page source. Contact = resume-request form + LinkedIn/GitHub.

## Design system that read as premium
Ivory `#EEE7DE` background (= video backdrop), ink `#16130F`, champagne gold `#B8925A`, sand; Instrument Serif headlines (italic accent), Geist body, Geist Mono labels. Optional macOS layer (menu bar + clock, Dock with magnification, ⌘K Spotlight, window title bars) only if the person likes it; keep About editorial, not a Mac dialog. Logo = initials monogram used for favicon, menu bar, Dock, loader.

Spotlight: show ALL entries grouped (journey, work, contact) with coloured tiles and dates; chapters as an icon row; search hidden keywords (skills, certifications). Never truncate the empty state.

## Mobile (test as a device, not a narrow window)
- Playwright `devices['iPhone 13']` and `devices['iPad Mini']` (touch + DPR).
- Presenter on top in hero; bubble afterwards; upright tablets use the phone composition.
- Inputs 16px (prevents iOS zoom). Cards padded to clear bubble + Dock. One compact toast. Hide desktop HUD.
- Check `scrollWidth === clientWidth` at every anchor; offscreen honeypots must not cross the edge.

## Verification script checklist
1. Screenshot every anchor at 1440×900 in real Chrome (`channel: 'chrome'`); SwiftShader is OK for layout only.
2. Clips: wave after load → still portrait; click/bubble hover → laugh; coffee at contact.
3. Every quest via DOM button; trophy count reaches total; no page errors.
4. Spotlight: empty state lists everything; search; Enter navigates/opens.
5. Mobile + tablet pass above. Reduced-motion: smooth === exact.
6. API: invalid body → 400, honeypot → 200 without sending, real send to owner only.
7. Deploy preview; go live with `vercel deploy --prod` + domain only when the person says so.
