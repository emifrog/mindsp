"use client";

import { useState, useEffect } from "react";
import { X, Users, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface Recipient {
  id: string;
  type: "user" | "list";
  name: string;
  email?: string;
  avatar?: string | null;
  memberCount?: number;
}

interface RecipientSelectorProps {
  selectedRecipients: Recipient[];
  onRecipientsChange: (recipients: Recipient[]) => void;
  placeholder?: string;
}

export function RecipientSelector({
  selectedRecipients,
  onRecipientsChange,
  placeholder = "Ajouter des destinataires...",
}: RecipientSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string; email: string; avatar?: string | null }[]>([]);
  const [lists, setLists] = useState<{ id: string; name: string; _count?: { members: number } }[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    if (debouncedSearch) {
      fetchSuggestions();
    } else {
      setUsers([]);
      setLists([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);

      // Fetch users et lists en parallèle
      const [usersRes, listsRes] = await Promise.all([
        fetch(`/api/messaging/directory?search=${encodeURIComponent(debouncedSearch)}&limit=5`),
        fetch("/api/messaging/lists"),
      ]);

      const [usersData, listsData] = await Promise.all([
        usersRes.json(),
        listsRes.json(),
      ]);

      setUsers(usersData.users || []);
      setLists(
        (listsData.lists || []).filter((list: { id: string; name: string; _count?: { members: number } }) =>
          list.name.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      );
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: { id: string; firstName: string; lastName: string; email: string; avatar?: string | null }) => {
    const recipient: Recipient = {
      id: user.id,
      type: "user",
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      avatar: user.avatar,
    };

    if (!selectedRecipients.find((r) => r.id === recipient.id)) {
      onRecipientsChange([...selectedRecipients, recipient]);
    }

    setSearch("");
    setOpen(false);
  };

  const handleSelectList = (list: { id: string; name: string; _count?: { members: number } }) => {
    const recipient: Recipient = {
      id: list.id,
      type: "list",
      name: list.name,
      memberCount: list._count?.members || 0,
    };

    if (!selectedRecipients.find((r) => r.id === recipient.id)) {
      onRecipientsChange([...selectedRecipients, recipient]);
    }

    setSearch("");
    setOpen(false);
  };

  const handleRemoveRecipient = (id: string) => {
    onRecipientsChange(selectedRecipients.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-2">
      {/* Recipients sélectionnés */}
      {selectedRecipients.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedRecipients.map((recipient) => (
            <Badge
              key={recipient.id}
              variant="secondary"
              className="gap-2 pr-1"
            >
              {recipient.type === "user" ? (
                <User className="h-3 w-3" />
              ) : (
                <Users className="h-3 w-3" />
              )}
              <span>{recipient.name}</span>
              {recipient.memberCount !== undefined && (
                <span className="text-xs text-muted-foreground">
                  ({recipient.memberCount})
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleRemoveRecipient(recipient.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Sélecteur */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left font-normal"
          >
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Rechercher un contact ou une liste..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              {loading ? (
                <div className="py-6 text-center text-sm">
                  Recherche en cours...
                </div>
              ) : (
                <>
                  {users.length === 0 && lists.length === 0 && search && (
                    <CommandEmpty>Aucun résultat trouvé</CommandEmpty>
                  )}

                  {users.length > 0 && (
                    <CommandGroup heading="Contacts">
                      {users.map((user) => (
                        <CommandItem
                          key={user.id}
                          onSelect={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar || undefined} />
                              <AvatarFallback className="text-xs">
                                {user.firstName[0]}
                                {user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">
                                {user.firstName} {user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}

                  {users.length > 0 && lists.length > 0 && <CommandSeparator />}

                  {lists.length > 0 && (
                    <CommandGroup heading="Listes de diffusion">
                      {lists.map((list) => (
                        <CommandItem
                          key={list.id}
                          onSelect={() => handleSelectList(list)}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                              <Users className="h-3 w-3 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{list.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {list._count?.members || 0} membre(s)
                              </p>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
