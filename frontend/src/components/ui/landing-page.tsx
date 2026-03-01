import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function LandingPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="relative flex h-screen w-full flex-col bg-hero xl:flex-row">
      {/* Image: mobile = full-bleed behind content (5% opacity + overlay). Desktop = left column, full opacity. */}
      <div className="absolute inset-0 z-0 opacity-5 xl:relative xl:z-auto xl:w-hero-column xl:shrink-0 xl:opacity-100">
        <div className="absolute inset-0 xl:relative xl:size-full">
          <img
            src="/landing-hero.png"
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
          <div
            className="absolute inset-0 bg-hero-overlay mix-blend-soft-light"
            aria-hidden
          />
        </div>
      </div>

      {/* Content: centered on both viewports. Mobile p-6, desktop section spacing. */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center p-6 xl:bg-hero xl:px-section-x xl:py-section-y">
        <div className="flex w-full max-w-content flex-col items-center gap-12">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img src="/unic-logo-white.svg" alt="UnIC" />
          </div>

          {/* Copy */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl font-semibold text-white">
              {t("landing.title")}
            </h1>
            <p className="text-base text-white">
              {t("landing.description")}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex w-full justify-center gap-4 xl:justify-start">
            <Button
              size="lg"
              onClick={() => navigate("/projects")}
            >
              {t("landing.login")}
            </Button>
            <Button
              variant="outline"
              size="lg"
            >
              {t("landing.register")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
