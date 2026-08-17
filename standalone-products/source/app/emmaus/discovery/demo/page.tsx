import DiscoveryPlayer from "@/components/emmaus/DiscoveryPlayer";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function EmmausDiscoveryDemoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <DiscoveryPlayer
      title="The Eternal Word"
      subtitle="Discover what John reveals before Jesus ever enters the scene."
      reference="John 1:1–5"
      translation="KJV"
      prompts={{
        observe: "Which words, ideas, or contrasts repeat in John 1:1–5? What does the passage explicitly say about the Word?",
        wonder: "Why do you think John begins his Gospel before creation itself? What questions does the phrase ‘the Word’ raise for you?",
        reflect: "How should the identity of Jesus in this passage reshape the way you trust Him in darkness, uncertainty, or disappointment?",
        pray: "Praise Jesus for who this passage reveals Him to be. Ask Him to bring His light into one specific area of your life.",
      }}
    />
  );
}
