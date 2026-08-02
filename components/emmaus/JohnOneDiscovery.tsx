"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const steps = ["Read", "Observe", "Wonder", "Explore", "Reflect", "Pray"] as const;
type Step = (typeof steps)[number];
type SaveStatus = "loading" | "saved" | "saving" | "offline" | "error";

const passage = [
  [1, "In the beginning was the Word, and the Word was with God, and the Word was God."],