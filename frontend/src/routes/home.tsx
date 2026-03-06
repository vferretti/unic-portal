import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FolderOpen, BookOpen, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/base/ui/card";
import { Button } from "@/components/base/ui/button";
import { PageHeader } from "@/components/base/page/page-header";
import { useCatalogStats } from "@/hooks/useCatalogStats";

const TOOLS = [
  { src: "/rstudio.png", alt: "RStudio" },
  { src: "/redcap.png", alt: "REDCap" },
  { src: "/shiny.jpeg", alt: "Shiny" },
  { src: "/jupyter.png", alt: "Jupyter" },
];

export default function Home() {
  const { t, i18n } = useTranslation();
  const { stats } = useCatalogStats();

  const researchCount = stats.research_project?.resource_count ?? 0;
  const eqpCount = stats.eqp?.resource_count ?? 0;
  const systemCount = stats.source_system?.resource_count ?? 0;
  const tableCount =
    (stats.source_system?.table_count ?? 0) +
    (stats.warehouse?.table_count ?? 0) +
    (stats.research_project?.table_count ?? 0) +
    (stats.eqp?.table_count ?? 0);
  const variableCount =
    (stats.source_system?.variable_count ?? 0) +
    (stats.warehouse?.variable_count ?? 0) +
    (stats.research_project?.variable_count ?? 0) +
    (stats.eqp?.variable_count ?? 0);

  return (
    <>
      <PageHeader title={t("home.greeting")} description={t("home.welcome_subtitle")} />
      <div className="p-8">
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Explore card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("home.explore_title")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <Link
                  to="/projects"
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{t("home.explore_projects")}</div>
                    <div className="text-sm text-muted-foreground">{t("home.explore_projects_description")}</div>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
                <Link
                  to="/catalog"
                  className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-accent"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="size-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{t("home.explore_catalog")}</div>
                    <div className="text-sm text-muted-foreground">{t("home.explore_catalog_description")}</div>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </CardContent>
            </Card>

            {/* Stats card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("home.stats_title")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-3xl font-bold">{researchCount.toLocaleString(i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t("home.stats_label_research_projects")}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{eqpCount.toLocaleString(i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t("home.stats_label_eqp_projects")}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{systemCount.toLocaleString(i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t("home.stats_label_systems")}</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold">{tableCount.toLocaleString(i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t("home.stats_label_tables")}</div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-3xl font-bold">{variableCount.toLocaleString(i18n.language)}</div>
                    <div className="text-sm text-muted-foreground">{t("home.stats_label_variables")}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Zone Verte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t("home.green_zone_title")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("home.green_zone_description")}</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              <div className="flex items-center gap-6">
                {TOOLS.map((tool) => (
                  <div key={tool.alt} className="flex size-14 items-center justify-center rounded-lg bg-muted p-2">
                    <img src={tool.src} alt={tool.alt} className="h-10 object-contain" />
                  </div>
                ))}
                <Button className="bg-cta text-cta-foreground hover:bg-cta/90 ml-auto">
                  {t("home.green_zone_connect")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
