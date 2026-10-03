"use client";

import React, { useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Unlink,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  if (!editor) return null;

  const handleSetLink = () => {
    if (!linkUrl.trim()) {
      editor.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    editor.chain().focus().setLink({ href: url }).run();
    setLinkUrl("");
    setShowLinkInput(false);
  };

  const buttonClass = (isActive: boolean = false) =>
    cn(
      "p-1.5 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0",
      isActive &&
        "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 hover:bg-amber-200/70 dark:hover:bg-amber-950/80"
    );

  const divider = (
    <div className="h-4 w-px bg-slate-200 dark:border-slate-800 my-auto shrink-0 mx-0.5" />
  );

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center gap-0.5 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#111726]/95 backdrop-blur-xs">
      {/* Undo & Redo */}
      <button
        type="button"
        title="Undo (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={cn(buttonClass(), "disabled:opacity-30 disabled:hover:bg-transparent")}
      >
        <Undo2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Redo (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={cn(buttonClass(), "disabled:opacity-30 disabled:hover:bg-transparent")}
      >
        <Redo2 className="h-4 w-4" />
      </button>

      {divider}

      {/* Headings */}
      <button
        type="button"
        title="Heading 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 1 }))}
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Heading 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 2 }))}
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Heading 3"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive("heading", { level: 3 }))}
      >
        <Heading3 className="h-4 w-4" />
      </button>

      {divider}

      {/* Text Styles */}
      <button
        type="button"
        title="Bold (Ctrl+B)"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive("bold"))}
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Italic (Ctrl+I)"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive("italic"))}
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Underline (Ctrl+U)"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive("underline"))}
      >
        <UnderlineIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Strikethrough"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive("strike"))}
      >
        <Strikethrough className="h-4 w-4" />
      </button>

      {divider}

      {/* Lists */}
      <button
        type="button"
        title="Bulleted List"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive("bulletList"))}
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Numbered List"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive("orderedList"))}
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Checklist / Task List"
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={buttonClass(editor.isActive("taskList"))}
      >
        <CheckSquare className="h-4 w-4" />
      </button>

      {divider}

      {/* Blocks */}
      <button
        type="button"
        title="Quote"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive("blockquote"))}
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Code Block"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={buttonClass(editor.isActive("codeBlock"))}
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        title="Horizontal Divider"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={buttonClass()}
      >
        <Minus className="h-4 w-4" />
      </button>

      {divider}

      {/* Link */}
      {editor.isActive("link") ? (
        <button
          type="button"
          title="Remove Link"
          onClick={() => editor.chain().focus().unsetLink().run()}
          className={buttonClass(true)}
        >
          <Unlink className="h-4 w-4" />
        </button>
      ) : (
        <button
          type="button"
          title="Add Link"
          onClick={() => {
            const previousUrl = editor.getAttributes("link").href || "";
            setLinkUrl(previousUrl);
            setShowLinkInput((v) => !v);
          }}
          className={buttonClass(showLinkInput)}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
      )}

      {/* Inline Link Popover */}
      {showLinkInput && (
        <div className="absolute top-full left-4 mt-1.5 p-2 bg-white dark:bg-[#111726] border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg flex items-center gap-2 z-30 animate-in fade-in">
          <input
            type="url"
            placeholder="Paste URL (e.g. https://...)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSetLink();
              if (e.key === "Escape") setShowLinkInput(false);
            }}
            autoFocus
            className="w-56 text-xs px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <button
            type="button"
            onClick={handleSetLink}
            className="text-xs px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium transition-colors"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
