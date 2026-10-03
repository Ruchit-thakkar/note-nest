import { Metadata } from "next";
import { getPublicNote } from "@/services/firestore";
import { PublicNoteViewer } from "./PublicNoteViewer";

interface PublicNotePageProps {
  params: Promise<{
    publicId: string;
  }>;
}

export async function generateMetadata({
  params,
}: PublicNotePageProps): Promise<Metadata> {
  const { publicId } = await params;
  const note = await getPublicNote(publicId);

  if (!note || !note.isPublished) {
    return {
      title: "Note Not Found — Note Nest",
      description: "This note is no longer available on Note Nest.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const snippet = note.plainText ? note.plainText.slice(0, 160) : "Read this note on Note Nest.";

  return {
    title: `${note.title || "Untitled Note"} — Note Nest`,
    description: snippet,
    authors: note.showCreator ? [{ name: note.creatorName }] : undefined,
    robots: {
      index: !!note.allowIndexing,
      follow: !!note.allowIndexing,
    },
    openGraph: {
      title: `${note.title || "Untitled Note"} — Note Nest`,
      description: snippet,
      type: "article",
      siteName: "Note Nest",
    },
    twitter: {
      card: "summary",
      title: `${note.title || "Untitled Note"} — Note Nest`,
      description: snippet,
    },
  };
}

export default async function PublicNotePage({ params }: PublicNotePageProps) {
  const { publicId } = await params;
  return <PublicNoteViewer publicId={publicId} />;
}
