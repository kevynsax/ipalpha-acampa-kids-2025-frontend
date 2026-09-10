import { useEffect, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { absolutizeFileUrls, fileUrl, relativizeFileUrls, uploadImage } from "../api/files";

interface RichTextEditorProps {
  /** HTML */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /**
   * Session token — when given, the 🖼️ button (and paste / drag-and-drop of
   * pictures) uploads to the server and inserts the image.
   */
  token?: string;
  /** big documents: taller editing area with a sticky toolbar */
  tall?: boolean;
}

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

/**
 * WYSIWYG editor (TipTap) limited to what the backend sanitizer accepts:
 * paragraphs, bold/italic/strike, headings 2–3, lists, quote, rule, links
 * and images (uploaded to /api/files, stored as relative urls).
 */
export default function RichTextEditor({ value, onChange, placeholder, disabled, token, tall }: RichTextEditorProps) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // kept in a ref so the paste/drop handlers (set up once) always see the latest token
  const tokenRef = useRef(token);
  tokenRef.current = token;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder: placeholder ?? "Escreva as instruções…" }),
    ],
    // the server stores "/api/files/<id>"; the editor needs absolute urls to render them
    content: absolutizeFileUrls(value),
    editable: !disabled,
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : relativizeFileUrls(editor.getHTML())),
    editorProps: {
      handlePaste: (_view, event) => {
        const files = [...(event.clipboardData?.files ?? [])].filter((f) => IMAGE_TYPES.includes(f.type));
        if (!files.length || !tokenRef.current) return false;
        event.preventDefault();
        void insertFiles(files);
        return true;
      },
      handleDrop: (_view, event) => {
        const files = [...(event.dataTransfer?.files ?? [])].filter((f) => IMAGE_TYPES.includes(f.type));
        if (!files.length || !tokenRef.current) return false;
        event.preventDefault();
        void insertFiles(files);
        return true;
      },
    },
  });

  useEffect(() => {
    editor?.setEditable(!disabled && !uploading);
  }, [editor, disabled, uploading]);

  async function insertFiles(files: File[]) {
    const t = tokenRef.current;
    if (!editor || !t) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const f of files) {
        const up = await uploadImage(t, f);
        editor.chain().focus().setImage({ src: fileUrl(up.url), alt: up.name }).run();
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Não foi possível enviar a imagem.");
    } finally {
      setUploading(false);
    }
  }

  if (!editor) return null;

  function setLink() {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Endereço do link (https://…)", prev ?? "https://");
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  const btn = (label: string, title: string, active: boolean, run: () => void, extra = "", isDisabled = false) => (
    <button
      type="button"
      className={`rte__btn ${extra} ${active ? "rte__btn--active" : ""}`}
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled || isDisabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={run}
    >
      {label}
    </button>
  );

  const c = () => editor.chain().focus();

  return (
    <div className={`rte ${disabled ? "rte--disabled" : ""} ${tall ? "rte--tall" : ""}`}>
      <div className="rte__bar" role="toolbar" aria-label="Formatação">
        {btn("B", "Negrito", editor.isActive("bold"), () => c().toggleBold().run(), "rte__btn--b")}
        {btn("I", "Itálico", editor.isActive("italic"), () => c().toggleItalic().run(), "rte__btn--i")}
        {btn("S", "Riscado", editor.isActive("strike"), () => c().toggleStrike().run(), "rte__btn--s")}
        <span className="rte__sep" />
        {btn("H2", "Título", editor.isActive("heading", { level: 2 }), () => c().toggleHeading({ level: 2 }).run())}
        {btn("H3", "Subtítulo", editor.isActive("heading", { level: 3 }), () => c().toggleHeading({ level: 3 }).run())}
        <span className="rte__sep" />
        {btn("•", "Lista", editor.isActive("bulletList"), () => c().toggleBulletList().run())}
        {btn("1.", "Lista numerada", editor.isActive("orderedList"), () => c().toggleOrderedList().run())}
        {btn("❝", "Citação", editor.isActive("blockquote"), () => c().toggleBlockquote().run())}
        {btn("—", "Linha", false, () => c().setHorizontalRule().run())}
        <span className="rte__sep" />
        {btn("🔗", "Link", editor.isActive("link"), setLink)}
        {token &&
          btn(uploading ? "⏳" : "🖼️", uploading ? "Enviando imagem…" : "Imagem (ou cole / arraste uma foto)", false, () => fileInput.current?.click(), "", uploading)}
        <span className="rte__sep" />
        {btn("↶", "Desfazer", false, () => c().undo().run())}
        {btn("↷", "Refazer", false, () => c().redo().run())}
      </div>
      <EditorContent editor={editor} className="rte__content" />
      {uploadError && <p className="rte__error">⚠️ {uploadError}</p>}
      {token && (
        <input
          ref={fileInput}
          type="file"
          accept={IMAGE_TYPES.join(",")}
          multiple
          hidden
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) void insertFiles(files);
          }}
        />
      )}
    </div>
  );
}
