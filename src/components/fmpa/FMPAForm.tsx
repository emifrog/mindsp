"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const fmpaFormSchema = z.object({
  title: z.string().min(3, "Le titre doit contenir au moins 3 caractères"),
  description: z.string().optional(),
  type: z.enum([
    "FORMATION",
    "MANOEUVRE",
    "EXERCICE",
    "PRESENCE_ACTIVE",
    "CEREMONIE",
    "REUNION",
    "AUTRE",
  ]),
  startDate: z.string(),
  endDate: z.string(),
  location: z.string().min(2, "Le lieu est requis"),
  objectives: z.string().optional(),
  equipment: z.string().optional(),
  maxParticipants: z.number().int().positive().optional(),
  requiresApproval: z.boolean().default(false),
  mealAvailable: z.boolean().default(false),
});

type FMPAFormValues = z.infer<typeof fmpaFormSchema>;

interface FMPAFormProps {
  initialData?: Partial<FMPAFormValues> & { id?: string };
  onSuccess?: () => void;
}

const FMPA_TYPES = [
  { value: "FORMATION", label: "Formation" },
  { value: "MANOEUVRE", label: "Manœuvre" },
  { value: "EXERCICE", label: "Exercice" },
  { value: "PRESENCE_ACTIVE", label: "Présence Active" },
  { value: "CEREMONIE", label: "Cérémonie" },
  { value: "REUNION", label: "Réunion" },
  { value: "AUTRE", label: "Autre" },
];

export function FMPAForm({ initialData, onSuccess }: FMPAFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FMPAFormValues>({
    resolver: zodResolver(fmpaFormSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || "",
      type: initialData?.type || "FORMATION",
      startDate: initialData?.startDate || "",
      endDate: initialData?.endDate || "",
      location: initialData?.location || "",
      objectives: initialData?.objectives || "",
      equipment: initialData?.equipment || "",
      maxParticipants: initialData?.maxParticipants || undefined,
      requiresApproval: initialData?.requiresApproval || false,
      mealAvailable: initialData?.mealAvailable || false,
    },
  });

  const onSubmit = async (data: FMPAFormValues) => {
    try {
      setIsSubmitting(true);

      const url = initialData?.id ? `/api/fmpa/${initialData.id}` : "/api/fmpa";
      const method = initialData?.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la sauvegarde");
      }

      const fmpa = await response.json();

      toast({
        title: initialData?.id ? "FMPA modifiée" : "FMPA créée",
        description: "L'opération a été effectuée avec succès",
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/fmpa/${fmpa.id}`);
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Formation incendie" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description de la FMPA..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FMPA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date et heure de début *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date et heure de fin *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Lieu *</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Caserne principale" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="objectives"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objectifs pédagogiques</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Objectifs de la formation..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Les objectifs à atteindre lors de cette FMPA
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="equipment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Matériel nécessaire</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Liste du matériel..."
                  className="min-h-[80px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Matériel que les participants doivent apporter
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxParticipants"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre maximum de participants</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="Illimité si vide"
                  {...field}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                  value={field.value || ""}
                />
              </FormControl>
              <FormDescription>
                Laisser vide pour un nombre illimité
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiresApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Approbation requise</FormLabel>
                <FormDescription>
                  Les inscriptions doivent être approuvées par un chef
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mealAvailable"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Repas disponible</FormLabel>
                <FormDescription>
                  Un repas sera proposé aux participants
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Enregistrement..."
              : initialData?.id
                ? "Modifier"
                : "Créer"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
