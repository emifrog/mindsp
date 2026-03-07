"use client";

import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Icons } from "@/lib/icons";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";

interface FMPA {
  id: string;
  type: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  maxParticipants: number | null;
  _count: {
    participations: number;
  };
}

interface FMPATableProps {
  fmpas: FMPA[];
  onDelete?: (id: string) => void;
}

const typeIcons: Record<string, string> = {
  FORMATION: Icons.fmpa.formation,
  MANOEUVRE: Icons.fmpa.manoeuvre,
  PRESENCE_ACTIVE: Icons.fmpa.presence,
};

const typeLabels: Record<string, string> = {
  FORMATION: "Formation",
  MANOEUVRE: "Manœuvre",
  PRESENCE_ACTIVE: "Présence Active",
};

const statusVariants: Record<string, { label: string; variant: string }> = {
  DRAFT: { label: "Brouillon", variant: "secondary" },
  PUBLISHED: { label: "Publié", variant: "default" },
  IN_PROGRESS: { label: "En cours", variant: "default" },
  COMPLETED: { label: "Terminé", variant: "outline" },
  CANCELLED: { label: "Annulé", variant: "destructive" },
};

export function FMPATable({ fmpas, onDelete }: FMPATableProps) {
  const router = useRouter();

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Titre</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Lieu</TableHead>
            <TableHead>Participants</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fmpas.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <div className="flex flex-col items-center gap-2">
                  <Icon name="fluent-emoji:empty-nest" size="xl" />
                  <p className="text-muted-foreground">Aucune FMPA trouvée</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            fmpas.map((fmpa) => (
              <TableRow
                key={fmpa.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/fmpa/${fmpa.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon name={typeIcons[fmpa.type]} size="md" />
                    <span className="font-medium">{typeLabels[fmpa.type]}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{fmpa.title}</TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1 text-sm">
                    <span>
                      {format(new Date(fmpa.startDate), "d MMM yyyy", {
                        locale: fr,
                      })}
                    </span>
                    <span className="text-muted-foreground">
                      {format(new Date(fmpa.startDate), "HH:mm", {
                        locale: fr,
                      })}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Icon name={Icons.info.location} size="sm" />
                    <span>{fmpa.location}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon name={Icons.info.users} size="sm" />
                    <span>
                      {fmpa._count.participations}
                      {fmpa.maxParticipants && ` / ${fmpa.maxParticipants}`}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariants[fmpa.status].variant}>
                    {statusVariants[fmpa.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/fmpa/${fmpa.id}/edit`);
                      }}
                    >
                      <Icon name={Icons.action.edit} size="sm" />
                    </Button>
                    {onDelete && (
                      <div onClick={(e) => e.stopPropagation()}>
                        <DeleteConfirmDialog
                          title="Supprimer cette FMPA ?"
                          description={`Êtes-vous sûr de vouloir supprimer "${fmpa.title}" ? Cette action est irréversible.`}
                          onConfirm={() => onDelete(fmpa.id)}
                        />
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
