import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState<boolean[]>([]);
  
  // 이미지 로드 상태 초기화
  useEffect(() => {
    setIsLoaded(Array(images.length).fill(false));
  }, [images]);
  
  // 이미지 로드 완료 처리
  const handleImageLoad = (index: number) => {
    setIsLoaded(prev => {
      const newState = [...prev];
      newState[index] = true;
      return newState;
    });
  };
  
  // 다음 이미지 이동
  const nextImage = () => {
    setActiveIndex((prev) => (prev + 1) % images.length);
  };
  
  // 이전 이미지 이동
  const prevImage = () => {
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };
  
  // 썸네일 클릭 시 해당 이미지로 이동
  const selectImage = (index: number) => {
    setActiveIndex(index);
  };
  
  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-neutral-100">
        {/* 메인 이미지 */}
        <div className="relative aspect-[4/3] w-full">
          {images.map((image, index) => (
            <div 
              key={index}
              className={`absolute inset-0 transition-opacity duration-300 ${
                index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
              }`}
            >
              {!isLoaded[index] && (
                <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
                  <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
              <img 
                src={image} 
                alt={`갤러리 이미지 ${index + 1}`} 
                className="w-full h-full object-cover"
                onLoad={() => handleImageLoad(index)}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>
        
        {/* 좌우 이동 버튼 */}
        {images.length > 1 && (
          <>
            <Button 
              variant="outline" 
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full shadow-md"
              onClick={prevImage}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/80 hover:bg-white rounded-full shadow-md"
              onClick={nextImage}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}
        
        {/* 페이지 표시기 */}
        {images.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/50 text-white px-2 py-1 rounded-full text-xs">
            {activeIndex + 1} / {images.length}
          </div>
        )}
      </div>
      
      {/* 썸네일 갤러리 */}
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => selectImage(index)}
              className={`relative rounded overflow-hidden aspect-[4/3] ${
                activeIndex === index ? "ring-2 ring-primary" : "opacity-70 hover:opacity-100"
              }`}
            >
              <img 
                src={image} 
                alt={`썸네일 ${index + 1}`} 
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
