import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCatalogStats } from "@/hooks/useCatalogStats";

const TOOLS = [
  { src: "/rstudio.png", alt: "RStudio" },
  { src: "/redcap.png", alt: "REDCap" },
  { src: "/shiny.jpeg", alt: "Shiny" },
  { src: "/jupyter.png", alt: "Jupyter" },
];

export default function Home() {
  const { t } = useTranslation();
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
    <div className="p-8 flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("home.greeting")}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Explore card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("home.explore_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>
                <Link to="/projects" className="text-primary underline hover:no-underline">
                  {t("home.explore_projects")}
                </Link>
              </li>
              <li>
                <Link to="/catalog" className="text-primary underline hover:no-underline">
                  {t("home.explore_catalog")}
                </Link>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Stats card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("home.stats_title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              <li>{t("home.stats_research_projects", { count: researchCount })}</li>
              <li>{t("home.stats_eqp_projects", { count: eqpCount })}</li>
              <li>{t("home.stats_systems", { count: systemCount })}</li>
              <li>{t("home.stats_tables", { count: tableCount })}</li>
              <li>{t("home.stats_variables", { count: variableCount })}</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Zone Verte */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t("home.green_zone_title")}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <p className="text-sm text-muted-foreground">
            {t("home.green_zone_description")}
          </p>
          <div className="flex items-center gap-6">
            {TOOLS.map((tool) => (
              <img
                key={tool.alt}
                src={tool.src}
                alt={tool.alt}
                className="h-12 object-contain"
              />
            ))}
            <Button className="bg-hero text-hero-foreground hover:bg-hero/90 ml-auto">
              {t("home.green_zone_connect")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
