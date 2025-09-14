import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface ImageGalleryProps {
  imageUrls: (string | null)[];
}

export function ImageGallery({ imageUrls }: ImageGalleryProps) {
  const [zoomIdx, setZoomIdx] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef<{x:number, y:number} | null>(null);
  const offsetRef = useRef<{x:number, y:number}>({ x: 0, y: 0 });

  // Zoom in/out toggle
  // Xử lý click vào ảnh khi đang zoom: nếu không drag thì zoom in/out
  const handleZoomImgClick = (idx: number, e?: React.MouseEvent) => {
    if (zoomIdx === idx) {
      setZoom(z => z >= 2 ? 1 : 2); // Toggle zoom in/out
      // Giữ nguyên offset khi zoom in/out
    } else if (activeIdx === idx) {
      setZoomIdx(idx);
      setZoom(2);
      setOffset({ x: 0, y: 0 }); // Reset offset khi chuyển từ active sang zoom
    }
  };

  // Zoom/pan handlers
  const handleImgClick = (idx: number) => {
    if (zoomIdx === idx) return;
    if (activeIdx === idx) {
      setZoomIdx(idx);
      setZoom(1.5);
      setOffset({ x: 0, y: 0 });
    }
  };
  const handleZoomClose = () => {
    setZoomIdx(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setActiveIdx(null);
  };
  const handleWheel = (e: React.WheelEvent<HTMLImageElement>) => {
    e.preventDefault();
    setZoom(z => Math.max(1, Math.min(z + (e.deltaY < 0 ? 0.2 : -0.2), 5)));
  };
  const handleMouseDown = (e: React.MouseEvent) => {
    // Chỉ cho phép pan khi chuột bắt đầu trên ảnh và đang zoom
    if (e.target instanceof HTMLImageElement && zoom > 1) {
      e.stopPropagation();
      draggingRef.current = true;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      window.addEventListener('mousemove', handleWindowMouseMove);
      window.addEventListener('mouseup', handleWindowMouseUp);
    }
  };
  const handleWindowMouseMove = (e: MouseEvent) => {
    if (draggingRef.current && dragStartRef.current) {
      offsetRef.current = {
        x: offsetRef.current.x + (e.clientX - dragStartRef.current.x) / zoom,
        y: offsetRef.current.y + (e.clientY - dragStartRef.current.y) / zoom
      };
      setOffset({ ...offsetRef.current });
      dragStartRef.current = { x: e.clientX, y: e.clientY };
    }
  };
  const handleWindowMouseUp = () => {
  draggingRef.current = false;
  dragStartRef.current = null;
  window.removeEventListener('mousemove', handleWindowMouseMove);
  window.removeEventListener('mouseup', handleWindowMouseUp);
  };

  // Xử lý click vào ảnh khi đang zoom: nếu không drag thì zoom in/out
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{[key:number]: {w:number, h:number}}>({});

  const handleMouseEnter = (idx: number) => {
    if (activeIdx !== idx) setHoverIdx(idx);
  };
  const handleMouseLeave = (idx: number) => {
    if (activeIdx !== idx) setHoverIdx(null);
  };
  const handleImgLoad = (idx: number, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setDimensions(dims => ({ ...dims, [idx]: { w: img.naturalWidth, h: img.naturalHeight } }));
  };

  return (
    <div className="flex gap-2 mb-4">
      {imageUrls.filter(Boolean).map((url, idx) => {
        if (!url) return null;
        let width = 128; // 8rem
        let objectFit = "contain";
        let ratio = dimensions[idx] ? dimensions[idx].h / dimensions[idx].w : 1;
        let height = width * ratio;
        let zIndex = 1;
        // Click: overlay, width 600px, height tự động
        if (zoomIdx === idx) {
          let naturalW = dimensions[idx]?.w || 600;
          let naturalH = dimensions[idx]?.h || 400;
          let maxH = window.innerHeight * 0.9;
          let maxW = window.innerWidth * 0.9;
          let imgHeight = Math.min(600 * (naturalH / naturalW) * zoom, maxH);
          let imgWidth = imgHeight * (naturalW / naturalH);
          if (imgWidth > maxW) {
            imgWidth = maxW;
            imgHeight = imgWidth * (naturalH / naturalW);
          }

          const modalContent = (
            <div
              key={"zoom-"+idx}
              className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/80 transition-all duration-300 overflow-auto"
              style={{
                zIndex: 2147483647,
                cursor: draggingRef.current ? 'grabbing' : 'grab',
                position: 'fixed',
                top: '0 !important',
                left: '0 !important',
                width: '100vw !important',
                height: '100vh !important',
                isolation: 'isolate'
              }}
              onClick={handleZoomClose}
            >
              <img
                src={url}
                alt={`Note attachment ${idx + 1}`}
                style={{ width: imgWidth + "px", height: imgHeight + "px", objectFit: "contain", borderRadius: "1rem", boxShadow: "0 0 32px #0008", transform: `translate(${offset.x * zoom}px,${offset.y * zoom}px) scale(${zoom})` }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onClick={e => { e.stopPropagation(); handleZoomImgClick(idx, e); }}
                onLoad={e => handleImgLoad(idx, e)}
                draggable={false}
              />
            </div>
          );

          return createPortal(modalContent, document.body);
        }
        if (activeIdx === idx) {
          let naturalW = dimensions[idx]?.w || 600;
          let naturalH = dimensions[idx]?.h || 400;
          let maxH = window.innerHeight * 0.9;
          let imgHeight = Math.min(600 * (naturalH / naturalW), maxH);
          let imgWidth = imgHeight * (naturalW / naturalH);
          if (imgHeight < 600 * (naturalH / naturalW)) {
            imgWidth = 600;
            imgHeight = 600 * (naturalH / naturalW);
            if (imgHeight > maxH) {
              imgHeight = maxH;
              imgWidth = imgHeight * (naturalW / naturalH);
            }
          }

          const modalContent = (
            <div
              key={"active-"+idx}
              className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/70 transition-all duration-300"
              style={{
                zIndex: 2147483646,
                position: 'fixed',
                top: '0 !important',
                left: '0 !important',
                width: '100vw !important',
                height: '100vh !important',
                isolation: 'isolate'
              }}
              onClick={() => setActiveIdx(null)}
            >
              <img
                src={url}
                alt={`Note attachment ${idx + 1}`}
                style={{ width: imgWidth + "px", height: imgHeight + "px", objectFit: "contain", borderRadius: "1rem", boxShadow: "0 0 32px #0008" }}
                onLoad={e => handleImgLoad(idx, e)}
                onClick={e => { e.stopPropagation(); handleImgClick(idx); }}
              />
            </div>
          );

          return createPortal(modalContent, document.body);
        }
        // Bình thường
        const isCurrentHovered = hoverIdx === idx;
        return (
          <div
            key={idx}
            className="relative bg-gray-100 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden"
            style={{ width: width + "px", height: height + "px", zIndex }}
            onClick={() => setActiveIdx(idx)}
            onMouseEnter={() => handleMouseEnter(idx)}
            onMouseLeave={() => handleMouseLeave(idx)}
          >
            <img
              src={url}
              alt={`Note attachment ${idx + 1}`}
              className={`rounded-lg border border-gray-200 w-full h-full transition-all duration-500 ${
                isCurrentHovered
                  ? 'scale-110 brightness-110 contrast-105 shadow-xl'
                  : 'scale-100 brightness-100 contrast-100 shadow-none'
              }`}
              style={{ objectFit: "contain" }}
              onLoad={e => handleImgLoad(idx, e)}
            />

            {/* Hover overlay with subtle gradient */}
            <div className={`absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-white/10 transition-opacity duration-300 rounded-lg pointer-events-none ${
              isCurrentHovered ? 'opacity-100' : 'opacity-0'
            }`} />

            {/* Hover indicator */}
            <div className={`absolute top-2 right-2 transition-all duration-300 ${
              isCurrentHovered
                ? 'opacity-100 scale-100'
                : 'opacity-0 scale-75'
            }`}>
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}