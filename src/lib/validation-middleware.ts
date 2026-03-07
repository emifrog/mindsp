/**
 * Middleware de validation réutilisable pour les routes API
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { formatZodErrors } from "./validation-schemas";

/**
 * Wrapper pour valider le body d'une requête
 */
export function withValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (
    request: NextRequest,
    validatedData: T,
    params?: Record<string, string>
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    try {
      const body = await request.json();
      const validation = schema.safeParse(body);

      if (!validation.success) {
        return NextResponse.json(
          {
            error: "Données invalides",
            details: formatZodErrors(validation.error),
          },
          { status: 400 }
        );
      }

      return handler(request, validation.data, context?.params);
    } catch (error) {
      if (error instanceof SyntaxError) {
        return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
      }
      throw error;
    }
  };
}

/**
 * Wrapper pour valider les query params
 */
export function withQueryValidation<T>(
  schema: z.ZodSchema<T>,
  handler: (
    request: NextRequest,
    validatedQuery: T,
    params?: Record<string, string>
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: { params: Record<string, string> }) => {
    const { searchParams } = new URL(request.url);
    const queryObject: Record<string, string> = {};

    searchParams.forEach((value, key) => {
      queryObject[key] = value;
    });

    const validation = schema.safeParse(queryObject);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Paramètres invalides",
          details: formatZodErrors(validation.error),
        },
        { status: 400 }
      );
    }

    return handler(request, validation.data, context?.params);
  };
}

/**
 * Exemple d'utilisation :
 *
 * ```typescript
 * import { withValidation } from "@/lib/validation-middleware";
 * import { createFmpaSchema } from "@/lib/validation-schemas";
 *
 * export const POST = withValidation(
 *   createFmpaSchema,
 *   async (request, validatedData) => {
 *     const fmpa = await prisma.fMPA.create({
 *       data: validatedData,
 *     });
 *     return NextResponse.json({ fmpa }, { status: 201 });
 *   }
 * );
 * ```
 */
