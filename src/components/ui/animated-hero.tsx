import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { MoveRight, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useConvexAuth } from "convex/react";

function Hero() {
  const navigate = useNavigate();
  const { isAuthenticated } = useConvexAuth();
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = useMemo(
    () => ["NoteArt", "thông minh", "sáng tạo", "hiệu quả", "đơn giản"],
    []
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 sm:gap-8 py-12 sm:py-20 lg:py-32 items-center justify-center flex-col max-w-4xl mx-auto">
          <div>
            <Button variant="secondary" size="sm" className="gap-4">
              Read our launch article <MoveRight className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex gap-4 flex-col text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl max-w-4xl tracking-tighter font-regular">
              <span className="text-slate-800">Chào mừng đến với</span>
              <span className="relative flex w-full justify-center overflow-hidden text-center md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-semibold"
                    initial={{ opacity: 0, y: "-100" }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <p className="text-base sm:text-lg md:text-xl leading-relaxed tracking-tight text-slate-600 max-w-3xl text-center px-4">
              Ứng dụng ghi chú thông minh với AI, giúp bạn tổ chức ý tưởng,
              lưu trữ thông tin và sáng tạo không giới hạn.
              Khám phá cách mới để ghi chú hiệu quả hơn.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              className="gap-3 px-6 py-3 text-base w-full sm:w-auto"
              variant="outline"
              onClick={() => navigate('/login')}
            >
              Khám phá tính năng <PhoneCall className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              className="gap-3 px-6 py-3 text-base w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              onClick={() => navigate(isAuthenticated ? '/notes' : '/login')}
            >
              {isAuthenticated ? 'Vào ứng dụng' : 'Bắt đầu ngay'} <MoveRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
