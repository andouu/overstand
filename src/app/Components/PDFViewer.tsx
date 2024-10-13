import React, { useState, useRef, useEffect } from "react";
import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.mjs";
import "pdfjs-dist/web/pdf_viewer.css";
import styles from "./PDFViewer.module.scss";

interface PDFViewerProps {
  width: number;
  height: number;
  pdfArray: Uint8Array;
  minSelectionWidth?: number;
  minSelectionHeight?: number;
  openCommentary: (pageNumber: number, highlightBlob: Blob | null) => void;
  closeCommentary: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({
  width,
  height,
  pdfArray,
  minSelectionWidth = 10,
  minSelectionHeight = 10,
  openCommentary,
  closeCommentary,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [pdfDocument, setPdfDocument] =
    useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [pages, setPages] = useState<Array<ImageData>>([]);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selection, setSelection] = useState<{
    // in pixels
    absStartX: number;
    absStartY: number;
    absEndX: number;
    absEndY: number;
    rectLeft: number;
    rectTop: number;
    scroll: number;
  } | null>(null);

  useEffect(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.mjs",
      import.meta.url
    ).toString();

    const loadPDF = async () => {
      const loadingTask = pdfjsLib.getDocument(pdfArray/* "/folland_section.pdf" */);
      const pdf = await loadingTask.promise;

      const tmpPages = new Array<ImageData>();
      let newXOffset = 0;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.height = height;
        pageCanvas.width = width;
        const pageContext = pageCanvas.getContext("2d");

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = height / unscaledViewport.height;
        const offsetX = (width - (unscaledViewport.width * scale)) / 2;
        const scaledViewport = page.getViewport({ offsetX, scale });

        const renderContext = {
          canvasContext: pageContext!, // force not null
          viewport: scaledViewport,
        };
        await page.render(renderContext).promise;
        tmpPages.push(pageContext!.getImageData(0, 0, width, height));
      }

      setPdfDocument(pdf);
      setNumPages(pdf.numPages);
      setPages(tmpPages);
    };
    loadPDF();
  }, [pdfArray, width, height]);

  useEffect(() => {
    if (!pdfDocument) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;

    context.clearRect(0, 0, width, height);

    pages.forEach((page, index) => {
      const y = index * height - scrollPosition;
      context.putImageData(page, 0, y);
    });
  }, [pages, scrollPosition, width, height]);

  const handleScroll = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const newScrollPosition = scrollPosition + e.deltaY;
    setScrollPosition(
      Math.max(0, Math.min(newScrollPosition, (numPages - 1) * height))
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragging(true);
      setSelection({
        absStartX: e.clientX,
        absStartY: e.clientY,
        absEndX: e.clientX,
        absEndY: e.clientY,
        rectLeft: rect.left,
        rectTop: rect.top,
        scroll: scrollPosition,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging && selection) {
      setSelection({
        ...selection,
        absEndX: e.clientX,
        absEndY: e.clientY,
      });
    }
  };

  const handleMouseUp = () => {
    if (dragging) {
      setDragging(false);
      captureSelection();
    }
  };

  const captureSelection = () => {
    if (selection && canvasRef.current) {
      const relX = selection.absStartX - selection.rectLeft;
      const relY = selection.absStartY - selection.rectTop;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      const selWidth = selection.absEndX - selection.absStartX;
      const selHeight = selection.absEndY - selection.absStartY;
      if (
        context &&
        selWidth >= minSelectionWidth &&
        selHeight >= minSelectionHeight
      ) {
        const imageData = context.getImageData(relX, relY, selWidth, selHeight);

        const pageNumber = Math.floor((scrollPosition + relY) / height) + 1;

        const blobCanvas = document.createElement("canvas");
        blobCanvas.width = selWidth;
        blobCanvas.height = selHeight;
        const blobContext = blobCanvas.getContext("2d");
        if (blobContext) {
          blobContext.putImageData(imageData, 0, 0);
          blobCanvas.toBlob((highlightBlob) => {
            openCommentary(pageNumber, highlightBlob);
          });
        }
      } else {
        closeCommentary();
      }
    }
  };

  return (
    <div>
      <div
        className={styles.pdfWrapper}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          style={{ cursor: dragging ? "crosshair" : "auto" }}
          className={styles.canvas}
          width={width}
          height={height}
          onWheel={handleScroll}
        />
        {selection && (
          <div
            className={styles.selection}
            style={{
              left: selection.absStartX - selection.rectLeft,
              top:
                selection.absStartY -
                selection.rectTop -
                (scrollPosition - selection.scroll),
              width: selection.absEndX - selection.absStartX,
              height: selection.absEndY - selection.absStartY,
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PDFViewer;
