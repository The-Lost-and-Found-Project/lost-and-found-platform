import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Discovery = {
  id: string;
  discovery_key: string;
  title: string | null;
  subtitle: string | null;
  translation: string | null;
  passage: unknown;
  created_at: string;
};

export default async function EmmausWalkPage() {
  const supabase = await createClient();
  const {
    data: { user },