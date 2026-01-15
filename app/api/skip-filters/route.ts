import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { userSkipFilters } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET - List all skip filters for the current user
export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const filters = await db.query.userSkipFilters.findMany({
    where: eq(userSkipFilters.userId, session.user.id),
    orderBy: (filters, { desc }) => [desc(filters.createdAt)],
  });

  return NextResponse.json(filters);
}

// POST - Create a new skip filter
export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { filterType, value } = body as {
    filterType: "email" | "domain";
    value: string;
  };

  if (!filterType || !value) {
    return NextResponse.json(
      { error: "filterType and value are required" },
      { status: 400 }
    );
  }

  if (filterType !== "email" && filterType !== "domain") {
    return NextResponse.json(
      { error: "filterType must be 'email' or 'domain'" },
      { status: 400 }
    );
  }

  // Normalize the value
  const normalizedValue = value.toLowerCase().trim();

  // Check if filter already exists
  const existing = await db.query.userSkipFilters.findFirst({
    where: and(
      eq(userSkipFilters.userId, session.user.id),
      eq(userSkipFilters.filterType, filterType),
      eq(userSkipFilters.value, normalizedValue)
    ),
  });

  if (existing) {
    return NextResponse.json(
      { error: "Filter already exists" },
      { status: 409 }
    );
  }

  const [newFilter] = await db
    .insert(userSkipFilters)
    .values({
      userId: session.user.id,
      filterType,
      value: normalizedValue,
    })
    .returning();

  return NextResponse.json(newFilter, { status: 201 });
}

// DELETE - Delete a skip filter by ID
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  // Verify the filter belongs to the user
  const filter = await db.query.userSkipFilters.findFirst({
    where: and(
      eq(userSkipFilters.id, id),
      eq(userSkipFilters.userId, session.user.id)
    ),
  });

  if (!filter) {
    return NextResponse.json({ error: "Filter not found" }, { status: 404 });
  }

  await db
    .delete(userSkipFilters)
    .where(eq(userSkipFilters.id, id));

  return NextResponse.json({ success: true });
}
