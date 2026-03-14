"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  coverImage: string | null;
  category: string;
  tags: string[];
  isPinned: boolean;
  viewCount: number;
  publishedAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar: string | null;
  };
  portal: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

const categoryIcons: Record<string, string> = {
  GENERAL: "ℹ️",
  FORMATION: Icons.nav.formations,
  INTERVENTION: "🚒",
  PREVENTION: "⚠️",
  MATERIEL: "📦",
  EVENEMENT: "🎉",
  ADMINISTRATIF: "📋",
};

const categoryLabels: Record<string, string> = {
  GENERAL: "Général",
  FORMATION: "Formation",
  INTERVENTION: "Intervention",
  PREVENTION: "Prévention",
  MATERIEL: "Matériel",
  EVENEMENT: "Événement",
  ADMINISTRATIF: "Administratif",
};

export default function ActualitesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [selectedCategory]);

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams({
        published: "true",
        ...(selectedCategory && { category: selectedCategory }),
      });

      const res = await fetch(`/api/news?${params}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setArticles(data.articles);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les actualités",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Icon name={Icons.ui.menu} size="2xl" className="animate-spin" />
      </div>
    );
  }

  const pinnedArticles = articles.filter((a) => a.isPinned);
  const regularArticles = articles.filter((a) => !a.isPinned);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Icon name={Icons.info.info} size="xl" />
          Actualités
        </h1>
        <p className="text-muted-foreground">
          Restez informé des dernières nouvelles
        </p>
      </div>

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategory(null)}
        >
          Toutes
        </Button>
        {Object.entries(categoryLabels).map(([key, label]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(key)}
          >
            <Icon name={categoryIcons[key]} size="sm" className="mr-2" />
            {label}
          </Button>
        ))}
      </div>

      {/* Articles épinglés */}
      {pinnedArticles.length > 0 && (
        <div>
          <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
            <Icon name="📌" size="md" />À la une
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {pinnedArticles.map((article) => (
              <Card
                key={article.id}
                className="cursor-pointer transition-shadow hover:shadow-lg"
                onClick={() => router.push(`/actualites/${article.slug}`)}
              >
                {article.coverImage && (
                  <div className="relative h-36 w-full overflow-hidden rounded-t-lg sm:h-48">
                    <Image
                      src={article.coverImage}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                )}
                <CardHeader>
                  <div className="mb-2 flex items-center gap-2">
                    <Badge>
                      <Icon
                        name={categoryIcons[article.category]}
                        size="xs"
                        className="mr-1"
                      />
                      {categoryLabels[article.category]}
                    </Badge>
                    {article.portal && (
                      <Badge variant="outline">{article.portal.name}</Badge>
                    )}
                  </div>
                  <CardTitle>{article.title}</CardTitle>
                  {article.excerpt && (
                    <CardDescription>{article.excerpt}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Icon name={Icons.info.user} size="sm" />
                      <span>
                        {article.author.firstName} {article.author.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Icon name={Icons.ui.eye} size="sm" />
                        <span>{article.viewCount}</span>
                      </div>
                      <span>
                        {format(new Date(article.publishedAt), "d MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Articles réguliers */}
      {regularArticles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Icon name="📭" size="2xl" className="mb-4" />
            <p className="text-center text-muted-foreground">
              Aucune actualité disponible
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {regularArticles.map((article) => (
            <Card
              key={article.id}
              className="cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => router.push(`/actualites/${article.slug}`)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant="outline">
                        <Icon
                          name={categoryIcons[article.category]}
                          size="xs"
                          className="mr-1"
                        />
                        {categoryLabels[article.category]}
                      </Badge>
                      {article.portal && (
                        <Badge variant="secondary">{article.portal.name}</Badge>
                      )}
                      {article.tags.map((tag) => (
                        <Badge key={tag} variant="outline">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <CardTitle className="text-xl">{article.title}</CardTitle>
                    {article.excerpt && (
                      <CardDescription className="mt-2">
                        {article.excerpt}
                      </CardDescription>
                    )}
                  </div>
                  {article.coverImage && (
                    <div className="relative ml-4 hidden h-24 w-32 flex-shrink-0 overflow-hidden rounded-lg sm:block">
                      <Image
                        src={article.coverImage}
                        alt={article.title}
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Icon name={Icons.info.user} size="sm" />
                    <span>
                      {article.author.firstName} {article.author.lastName}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Icon name={Icons.ui.eye} size="sm" />
                      <span>{article.viewCount}</span>
                    </div>
                    <span>
                      {format(new Date(article.publishedAt), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
