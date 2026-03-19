"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  content: string;
  author: string;
  date: string;
  url: string;
}

interface SearchResults {
  chat: SearchResult[];
  mail: SearchResult[];
  fmpa: SearchResult[];
  formations: SearchResult[];
  documents: SearchResult[];
  personnel: SearchResult[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResults>({
    chat: [],
    mail: [],
    fmpa: [],
    formations: [],
    documents: [],
    personnel: [],
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setResults({
        chat: [],
        mail: [],
        fmpa: [],
        formations: [],
        documents: [],
        personnel: [],
      });
      setTotal(0);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await res.json();

      setResults(data.results);
      setTotal(data.total);
    } catch (error) {
      console.error("Erreur recherche:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "chat":
        return "💬";
      case "mail":
        return "📨";
      case "fmpa":
        return "🚒";
      case "formation":
        return "🎓";
      case "document":
        return "📄";
      case "personnel":
        return "👤";
      default:
        return "🔍";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "chat":
        return "Chat";
      case "mail":
        return "Mail";
      case "fmpa":
        return "FMPA";
      case "formation":
        return "Formation";
      case "document":
        return "Document";
      case "personnel":
        return "Personnel";
      default:
        return type;
    }
  };

  const ResultItem = ({ result }: { result: SearchResult }) => (
    <Link href={result.url}>
      <div className="rounded-lg border p-4 transition-colors hover:bg-accent">
        <div className="flex items-start gap-3">
          <Icon
            name={getTypeIcon(result.type)}
            size="lg"
            className="mt-1 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {getTypeLabel(result.type)}
              </Badge>
              <h3 className="truncate font-semibold">{result.title}</h3>
            </div>
            <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">
              {result.content}
            </p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{result.author}</span>
              <span>•</span>
              <span>
                {formatDistanceToNow(new Date(result.date), {
                  addSuffix: true,
                  locale: fr,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );

  const allResults = [
    ...results.chat,
    ...results.mail,
    ...results.fmpa,
    ...results.formations,
    ...results.documents,
    ...results.personnel,
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="container mx-auto max-w-5xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="mb-4 flex items-center gap-3 text-2xl sm:text-3xl font-bold">
          <Icon name="🔍" size="xl" />
          Recherche Avancée
        </h1>

        {/* Barre de recherche */}
        <form onSubmit={handleSearch} className="relative">
          <Icon
            name={Icons.action.search}
            size="md"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            placeholder="Rechercher dans Chat, Mailbox, FMPA, Formations..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 pl-12 pr-24 text-base"
          />
          <Button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            disabled={loading || query.length < 2}
          >
            {loading ? (
              <Icon name={Icons.ui.menu} size="sm" className="animate-spin" />
            ) : (
              "Rechercher"
            )}
          </Button>
        </form>

        {/* Résultats count */}
        {query && !loading && (
          <p className="mt-3 text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                <span className="font-semibold">{total}</span> résultat
                {total > 1 ? "s" : ""} pour{" "}
                <span className="font-semibold">&quot;{query}&quot;</span>
              </>
            ) : (
              <>
                Aucun résultat pour{" "}
                <span className="font-semibold">&quot;{query}&quot;</span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Résultats */}
      {query && !loading && total > 0 && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="all">Tous ({total})</TabsTrigger>
            <TabsTrigger value="chat">
              💬 Chat ({results.chat.length})
            </TabsTrigger>
            <TabsTrigger value="mail">
              📧 Mail ({results.mail.length})
            </TabsTrigger>
            <TabsTrigger value="fmpa">
              🔥 FMPA ({results.fmpa.length})
            </TabsTrigger>
            <TabsTrigger value="formation">
              🎓 Formations ({results.formations.length})
            </TabsTrigger>
            <TabsTrigger value="document">
              📄 Documents ({results.documents.length})
            </TabsTrigger>
            <TabsTrigger value="personnel">
              👤 Personnel ({results.personnel.length})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-300px)]">
            <TabsContent value="all" className="space-y-3">
              {allResults.map((result) => (
                <ResultItem
                  key={`${result.type}-${result.id}`}
                  result={result}
                />
              ))}
            </TabsContent>

            <TabsContent value="chat" className="space-y-3">
              {results.chat.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </TabsContent>

            <TabsContent value="mail" className="space-y-3">
              {results.mail.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </TabsContent>

            <TabsContent value="fmpa" className="space-y-3">
              {results.fmpa.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </TabsContent>

            <TabsContent value="formation" className="space-y-3">
              {results.formations.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </TabsContent>

            <TabsContent value="document" className="space-y-3">
              {results.documents.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </TabsContent>

            <TabsContent value="personnel" className="space-y-3">
              {results.personnel.map((result) => (
                <ResultItem key={result.id} result={result} />
              ))}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      )}

      {/* État vide */}
      {!query && (
        <div className="py-16 text-center">
          <Icon
            name="🔍"
            size="2xl"
            className="mx-auto mb-4 opacity-50"
          />
          <h3 className="mb-2 text-lg font-semibold">
            Recherchez dans toute l&apos;application
          </h3>
          <p className="text-muted-foreground">
            Tapez au moins 2 caractères pour lancer une recherche
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <Icon
            name={Icons.ui.menu}
            size="2xl"
            className="mx-auto mb-4 animate-spin"
          />
          <p className="text-muted-foreground">Recherche en cours...</p>
        </div>
      )}
    </div>
  );
}
