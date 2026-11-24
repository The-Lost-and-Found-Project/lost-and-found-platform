"use server";
import{redirect}from"next/navigation";
export async function toggleSavedDirectoryEntry(){redirect("/resources");}
export async function submitDirectorySuggestion(){redirect("/resources");}
export async function submitDirectoryUpdate(){redirect("/resources");}
