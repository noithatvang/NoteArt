import { useState, useRef } from "react";

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
          return (
            <div
              key={"zoom-"+idx}
              className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/80 transition-all duration-300 overflow-auto"
              style={{ zIndex: 9999, cursor: draggingRef.current ? 'grabbing' : 'grab' }}
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
          return (
            <div
              key={"active-"+idx}
              className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/70 transition-all duration-300"
              style={{ zIndex: 9999 }}
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
        }
        // Bình thường
        return (
          <div
            key={idx}
            className="relative bg-gray-100 flex items-center justify-center transition-all duration-300"
            style={{ width: width + "px", height: height + "px", zIndex }}
            onClick={() => setActiveIdx(idx)}
          >
            <img
              src={url}
              alt={`Note attachment ${idx + 1}`}
              className="rounded-lg border border-gray-200 w-full h-full"
              style={{ objectFit: "contain" }}
              onLoad={e => handleImgLoad(idx, e)}
            />
          </div>
        );
      })}
    </div>
  );
}