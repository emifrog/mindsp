"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  FileSpreadsheet,
  ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface AttendanceParticipant {
  name: string;
  badge: string;
}

interface AttendanceData {
  title: string;
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  organizer: string;
  objectives?: string;
  equipment?: string;
  participants: AttendanceParticipant[];
}

interface ReportParticipant {
  name: string;
  badge?: string;
  reason?: string;
}

interface ReportData {
  header: {
    title: string;
    type: string;
    date: string;
    location: string;
    organizer: string;
    duration: string;
  };
  objectives?: string;
  equipment?: string;
  statistics: {
    totalParticipants: number;
    present: number;
    attendanceRate: number;
  };
  participants: {
    present: ReportParticipant[];
    absent: ReportParticipant[];
    excused: ReportParticipant[];
  };
}

interface FMPAExportButtonsProps {
  fmpaId: string;
  fmpaTitle: string;
}

export function FMPAExportButtons({
  fmpaId,
  fmpaTitle,
}: FMPAExportButtonsProps) {
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  const handleExport = async (type: string) => {
    try {
      setExporting(true);

      const response = await fetch(`/api/fmpa/${fmpaId}/export?type=${type}`);

      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }

      if (type === "participants") {
        // Télécharger le fichier Excel
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `participants-${fmpaId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export réussi",
          description: "La liste des participants a été téléchargée",
        });
      } else {
        // Pour attendance et report, récupérer les données JSON
        const data = await response.json();

        // Ouvrir dans une nouvelle fenêtre pour impression
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          if (type === "attendance") {
            printWindow.document.write(generateAttendanceHTML(data));
          } else if (type === "report") {
            printWindow.document.write(generateReportHTML(data));
          }
          printWindow.document.close();
          printWindow.print();
        }

        toast({
          title: "Export réussi",
          description: "Le document est prêt pour l'impression",
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter le document",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={exporting}>
          <Download className="mr-2 h-4 w-4" />
          {exporting ? "Export..." : "Exporter"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Exporter</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport("attendance")}>
          <ClipboardList className="mr-2 h-4 w-4" />
          Feuille d&apos;émargement (PDF)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("participants")}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Liste participants (Excel)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport("report")}>
          <FileText className="mr-2 h-4 w-4" />
          Rapport de manœuvre (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Générer le HTML pour la feuille d'émargement
function generateAttendanceHTML(data: AttendanceData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Feuille d'émargement - ${data.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; }
        .header { margin-bottom: 30px; }
        .info { display: flex; justify-content: space-between; margin-bottom: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .signature { width: 200px; }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <h1>FEUILLE D'ÉMARGEMENT</h1>
      <div class="header">
        <div class="info"><strong>Titre:</strong> ${data.title}</div>
        <div class="info"><strong>Type:</strong> ${data.type}</div>
        <div class="info"><strong>Date:</strong> ${data.date}</div>
        <div class="info"><strong>Horaires:</strong> ${data.startTime} - ${data.endTime}</div>
        <div class="info"><strong>Lieu:</strong> ${data.location}</div>
        <div class="info"><strong>Organisateur:</strong> ${data.organizer}</div>
      </div>
      
      ${data.objectives ? `<div><strong>Objectifs:</strong><p>${data.objectives}</p></div>` : ""}
      ${data.equipment ? `<div><strong>Matériel:</strong><p>${data.equipment}</p></div>` : ""}
      
      <table>
        <thead>
          <tr>
            <th>N°</th>
            <th>Nom et Prénom</th>
            <th>Badge</th>
            <th>Signature Arrivée</th>
            <th>Signature Départ</th>
          </tr>
        </thead>
        <tbody>
          ${data.participants
            .map(
              (p: AttendanceParticipant, i: number) => `
            <tr>
              <td>${i + 1}</td>
              <td>${p.name}</td>
              <td>${p.badge}</td>
              <td class="signature"></td>
              <td class="signature"></td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </body>
    </html>
  `;
}

// Générer le HTML pour le rapport de manœuvre
function generateReportHTML(data: ReportData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Rapport - ${data.header.title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #666; margin-top: 30px; }
        .header { margin-bottom: 30px; }
        .info { margin-bottom: 10px; }
        .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 20px 0; }
        .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
        .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
        ul { list-style: none; padding: 0; }
        li { padding: 5px 0; border-bottom: 1px solid #eee; }
        @media print {
          body { padding: 10px; }
        }
      </style>
    </head>
    <body>
      <h1>RAPPORT DE MANŒUVRE</h1>
      <div class="header">
        <div class="info"><strong>Titre:</strong> ${data.header.title}</div>
        <div class="info"><strong>Type:</strong> ${data.header.type}</div>
        <div class="info"><strong>Date:</strong> ${data.header.date}</div>
        <div class="info"><strong>Lieu:</strong> ${data.header.location}</div>
        <div class="info"><strong>Organisateur:</strong> ${data.header.organizer}</div>
        <div class="info"><strong>Durée:</strong> ${data.header.duration}</div>
      </div>

      <h2>Objectifs</h2>
      <p>${data.objectives || "Non spécifiés"}</p>

      <h2>Matériel utilisé</h2>
      <p>${data.equipment || "Non spécifié"}</p>

      <h2>Statistiques</h2>
      <div class="stats">
        <div class="stat-card">
          <div>Total participants</div>
          <div class="stat-value">${data.statistics.totalParticipants}</div>
        </div>
        <div class="stat-card">
          <div>Présents</div>
          <div class="stat-value">${data.statistics.present}</div>
        </div>
        <div class="stat-card">
          <div>Taux de présence</div>
          <div class="stat-value">${data.statistics.attendanceRate}%</div>
        </div>
      </div>

      <h2>Participants présents (${data.participants.present.length})</h2>
      <ul>
        ${data.participants.present
          .map(
            (p: ReportParticipant) => `
          <li>${p.name} - ${p.badge || "N/A"}</li>
        `
          )
          .join("")}
      </ul>

      ${
        data.participants.absent.length > 0
          ? `
        <h2>Absents (${data.participants.absent.length})</h2>
        <ul>
          ${data.participants.absent
            .map(
              (p: ReportParticipant) => `
            <li>${p.name} - ${p.badge || "N/A"}</li>
          `
            )
            .join("")}
        </ul>
      `
          : ""
      }

      ${
        data.participants.excused.length > 0
          ? `
        <h2>Excusés (${data.participants.excused.length})</h2>
        <ul>
          ${data.participants.excused
            .map(
              (p: ReportParticipant) => `
            <li>${p.name} - ${p.badge || "N/A"} ${p.reason ? `(${p.reason})` : ""}</li>
          `
            )
            .join("")}
        </ul>
      `
          : ""
      }
    </body>
    </html>
  `;
}
