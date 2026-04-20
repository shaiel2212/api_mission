# Client Specification: אתר ארטל בניה ופיתוח

אפיון שכבת הקליינט (Frontend). המקור באנגלית; נשמר לצורכי עקביות עם מסמכי המקור.

---

## 1. Client Overview

**Goal:** Develop a responsive, fast-loading website for Artel Construction and Development to enhance brand prestige and facilitate lead generation.

**Scope:** Homepage, About, Projects, Clients, Testimonials, Contact Us pages with lead management integration.

**Non-goals:** Development of mobile applications, lead management outside the website.

**Dependencies:** Google Analytics, WhatsApp integration, Instagram linking.

**Assumptions:** All content will be available at launch. Default conventions are used due to missing Git Agent data.

### Open Questions

- האם יש לוגואים נוספים שתרצו להציג בעמוד הלקוחות?
- האם ישנן המלצות נוספות שתרצו לכלול בעמוד ההמלצות?
- האם יש דרישות מיוחדות לגבי עיצוב האתר מעבר למה שצוין?

---

## 2. Frontend Architecture

| Topic | Decision |
|--------|----------|
| Framework/Library | React.js |
| Components | Functional components with hooks |
| State management | Context API for global state; local state for component-specific data |
| Routing | React Router (client-side) |
| Build | Webpack for bundling, Babel for transpiling |
| Backend integration | RESTful API for lead submission and data retrieval |

### 2.1 Existing Project Structure & Integration

- **Current frontend architecture overview:** MISSING — Assume standard React.js project structure.
- **Technologies:** React.js, Node.js, Express, MySQL (full stack context).
- **Key folders:** MISSING — Assume standard React.js project structure.
- **Existing components:** Assume no existing components.
- **Integration:** New project setup; N/A for reuse.
- **Conventions:** Standard React components and RESTful API conventions.

---

## 3. UI/UX Design Specifications

### Design System Integration

**Design tokens**

- Colors: White `#FFFFFF`, Black `#000000`, Dark Gray `#333333`, Gold `#FFD700`
- Typography: Modern sans-serif font family
- Spacing: Consistent padding/margins for a clean layout

**Component library:** Custom components per design specifications.

**Custom components needed:** Hero section, Contact buttons, Testimonials slider.

**Responsive breakpoints**

- Mobile: up to 768px
- Tablet: 768px–1024px
- Desktop: 1024px and above

### Layout & Structure

- **Page structure:** Header, Main Content, Footer
- **Header:** Navigation, Logo
- **Main Content:** Hero, About, Projects, Clients, Testimonials, Contact Form (per page composition as finalized)
- **Footer:** Contact information, social links
- **Layout:** Grid and Flexbox
- **Navigation:** Top navigation bar to all main pages

### Component Specifications

#### HeroSection

| Field | Detail |
|--------|--------|
| Purpose | Display introductory text and contact buttons |
| Props | Title, Subtitle, ButtonTexts |
| State | None |
| Events | Button clicks for contact actions |
| Visual states | Default, Hover |
| Responsive | Adjust text size and button layout on smaller screens |
| Accessibility | Keyboard-accessible buttons |

#### ContactForm

| Field | Detail |
|--------|--------|
| Purpose | Allow users to submit inquiries |
| Props | None |
| State | Form fields: name, phone, message |
| Events | Submit, validation |
| Visual states | Loading, Error, Success |
| Responsive | Stack fields vertically on mobile |
| Accessibility | ARIA labels, focus management |

### Figma / Design Integration

- **Design file reference:** MISSING — UI/UX details not available from Figma.
- **Implementation:** Follow design tokens above until Figma/sketches are attached.

---

## 4. State Management

- **Global:** User session data, form submission status (see note in open decisions doc: public site may not need `isLoggedIn`).
- **Local:** Form inputs, UI loading/error state.
- **Library:** Context API.
- **Suggested global shape (from spec):**  
  - `User: { isLoggedIn: boolean }`  
  - `Form: { name, phone, message }`
- **Persistence:** Session storage for temporary data.

---

## 5. Routing & Navigation

**Routes:** `/`, `/about`, `/projects`, `/clients`, `/testimonials`, `/contact`

- Route parameters: None
- Navigation: Top bar + footer links
- Route guards: None
- Deep linking: Supported
- Breadcrumbs: Not required

---

## 6. API Integration (Client-Side)

- **Endpoint:** `POST /api/leads`
- **Format:** JSON; handle success and error responses
- **Errors:** User-friendly messages
- **Loading:** Spinner during API calls
- **Retry:** Simple retry on network failure
- **Caching:** N/A
- **Real-time:** N/A

---

## 7. Forms & Validation

- **Component:** ContactForm
- **Rules:** Required fields; valid phone number format
- **Errors:** Below respective fields
- **Validation timing:** On blur and on submit (field-level); on submit (form-level)
- **Submission:** preventDefault → API
- **Dirty state:** Track field changes

---

## 8. Performance Optimization

- Code splitting: dynamic imports for page components
- Lazy loading: images and non-critical components
- Images: responsive techniques
- Bundle: minimize third-party libraries
- Caching: browser caching for static assets
- Memoization: `React.memo` where appropriate
- Virtual scrolling: N/A

---

## 9. Accessibility (a11y)

- ARIA labels/roles on interactive elements
- Full keyboard navigation
- Screen reader–friendly content
- Focus management and logical focus order
- Color contrast
- Semantic HTML
- Testing: e.g. Axe audits

---

## 10. Responsive Design

- Mobile-first
- Tablet: layout and font adjustments
- Desktop: full layout; optional extra content
- Touch-friendly targets
- Grid/Flexbox for layout adaptations

---

## 11. Error Handling & User Feedback

- React error boundaries
- Inline errors + toasts for critical errors
- Spinners / skeleton loaders
- Success toasts
- Empty states with clear messaging
- Basic offline messaging when network unavailable

---

## 12. Security (Client-Side)

- Authentication: N/A (public site)
- Authorization: N/A
- Token management: N/A
- XSS: sanitize user inputs
- CSRF: same-origin policy (align with deployment model)
- Input sanitization: validate and sanitize
- Storage: session storage for temporary data only where needed

---

## 13. Testing Plan

- Unit: utilities and pure logic
- Component: render and interactions
- Integration: API and data flow
- E2E: landing through form submission
- Visual regression: optional
- Accessibility: automated (Axe) + manual checks
- Test data: mocks for API

---

## 14. Implementation Plan (Frontend)

**Ordered tasks**

1. Set up React project with routing and state management.
2. Develop homepage components (HeroSection, ContactForm, plus BRD sections).
3. Implement About, Projects, Clients, Testimonials pages.
4. Integrate API for lead submission.
5. Responsive design and accessibility.
6. Testing and QA.

**Component order (suggested)**

1. HeroSection  
2. ContactForm  
3. AboutPage  
4. ProjectsPage  
5. ClientsPage  
6. TestimonialsPage  

**Dependencies:** API readiness, design finalization (Figma/sketches).

**Risks:** Design/implementation drift; integration issues.

**Rollout:** Phased launch (core pages first); monitor performance and feedback.
