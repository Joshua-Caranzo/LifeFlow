import { Loader2 } from "lucide-react";

interface LoaderProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loader({
  message = "Loading...",
  fullScreen = true,
}: LoaderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${
        fullScreen ? "min-h-screen" : "min-h-[400px]"
      }`}
    >
      {/* Animated Spinner */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        <Loader2 className="w-8 h-8 text-blue-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Loading Text */}
      <div className="text-center">
        <p className="text-lg font-medium text-gray-700">{message}</p>
        <div className="flex gap-1 justify-center mt-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
          <span
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          ></span>
          <span
            className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></span>
        </div>
      </div>
    </div>
  );
}
