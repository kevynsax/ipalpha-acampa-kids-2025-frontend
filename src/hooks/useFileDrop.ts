import { useCallback, useState } from "react";

/** Extensions the spreadsheet imports accept — same list as the file inputs. */
const SPREADSHEET_EXTENSIONS = [".csv", ".xls", ".xlsx"];

function isSpreadsheet(file: File): boolean {
  const name = file.name.toLowerCase();
  return SPREADSHEET_EXTENSIONS.some((ext) => name.endsWith(ext));
}

interface FileDrop {
  /** true while a file is hovering over the zone — for the "solte aqui" styling */
  dragging: boolean;
  /** spread onto the drop zone element */
  handlers: {
    onDragOver: (e: React.DragEvent) => void;
    onDragEnter: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

/**
 * Lets a zone accept a dropped spreadsheet (.csv / .xls / .xlsx). Non-matching
 * files are ignored so a stray image never enters the import. `onFile` gets the
 * first valid file dropped.
 */
export function useFileDrop(onFile: (file: File) => void, accept: (file: File) => boolean = isSpreadsheet): FileDrop {
  const [dragging, setDragging] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
  }, []);

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // only clear when the pointer actually leaves the zone, not a child
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = Array.from(e.dataTransfer?.files ?? []).find(accept);
      if (file) onFile(file);
    },
    [onFile, accept],
  );

  return { dragging, handlers: { onDragOver, onDragEnter, onDragLeave, onDrop } };
}
