import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/base/page/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/base/ui/card";
import { Badge } from "@/components/base/badges/badge";
import { Button } from "@/components/base/ui/button";
import { useCatalogStats } from "@/hooks/useCatalogStats";

const CATEGORIES = ["source_system", "warehouse", "research_project", "eqp"] as const;

type CategoryType = (typeof CATEGORIES)[number];

const STAT_LABELS: Record<CategoryType, [string, string]> = {
  source_system: ["systems", "variables"],
  warehouse: ["tables", "variables"],
  research_project: ["projects", "variables"],
  eqp: ["projects", "variables"],
};

const STAT_FIELDS: Record<string, "resource_count" | "table_count" | "variable_count"> = {
  systems: "resource_count",
  projects: "resource_count",
  tables: "table_count",
  variables: "variable_count",
};

const CATEGORY_COLORS: Record<
  CategoryType,
  {
    badge: "secondary";
    button: string;
  }
> = {
  source_system: { badge: "secondary", button: "bg-cta text-cta-foreground hover:bg-cta/90" },
  warehouse: { badge: "secondary", button: "bg-cta text-cta-foreground hover:bg-cta/90" },
  research_project: { badge: "secondary", button: "bg-cta text-cta-foreground hover:bg-cta/90" },
  eqp: { badge: "secondary", button: "bg-cta text-cta-foreground hover:bg-cta/90" },
};

const CATEGORY_ROUTES: Record<CategoryType, string> = {
  source_system: "system",
  warehouse: "warehouse",
  research_project: "research_project",
  eqp: "eqp",
};

export default function Catalog() {
  const { t, i18n } = useTranslation();
  const { stats, isLoading } = useCatalogStats();

  return (
    <>
      <PageHeader title={t("catalog.title")} description={t("catalog.description")} />
      <div className="p-8">
        {isLoading ? (
          <p className="text-muted-foreground">{t("common.loading")}</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map((type) => {
              const typeStat = stats[type];
              const colors = CATEGORY_COLORS[type];
              const [label1, label2] = STAT_LABELS[type];
              const count1 = typeStat?.[STAT_FIELDS[label1]] ?? 0;
              const count2 = typeStat?.[STAT_FIELDS[label2]] ?? 0;

              return (
                <Card key={type}>
                  <CardHeader>
                    <CardTitle className="text-lg">{t(`catalog.categories.${type}.title`)}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{t(`catalog.categories.${type}.description`)}</CardDescription>
                  </CardContent>
                  <CardFooter className="justify-between items-center">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={colors.badge}>
                        {t(`catalog.stats.${label1}`, {
                          count: count1,
                          formattedCount: count1.toLocaleString(i18n.language),
                        })}
                      </Badge>
                      <Badge variant={colors.badge}>
                        {t(`catalog.stats.${label2}`, {
                          count: count2,
                          formattedCount: count2.toLocaleString(i18n.language),
                        })}
                      </Badge>
                    </div>
                    <Button variant="default" size="sm" className={colors.button} asChild>
                      <Link to={`/catalog/${CATEGORY_ROUTES[type]}`}>
                        {t("catalog.explore")}
                        <ArrowRight />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
