import { Suspense, type ReactNode } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import FloatingWhatsApp from "./FloatingWhatsApp";
import SeoHead from "./SeoHead";
import JsonLdOrganization from "./JsonLdOrganization";

/**
 * @deprecated use nested routes with default Layout; kept for edge cases
 */
export function LayoutWithChildren({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        דלג לתוכן הראשי
      </a>
      <Header />
      <main id="main-content" className="flex-1 pt-20" tabIndex={-1}>
        {children}
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main-content" className="skip-link">
        דלג לתוכן הראשי
      </a>
      <SeoHead />
      <JsonLdOrganization />
      <Header />
      <main id="main-content" className="flex-1 pt-20" tabIndex={-1}>
        <Suspense
          fallback={
            <div className="flex min-h-[50vh] items-center justify-center text-gray-400" aria-busy="true">
              טוען…
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <FloatingWhatsApp />
    </div>
  );
}
