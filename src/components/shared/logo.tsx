import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizes = {
  sm: { image: 24, container: "h-6 w-6", text: "text-base" },
  md: { image: 32, container: "h-8 w-8", text: "text-xl" },
  lg: { image: 48, container: "h-12 w-12", text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, className }: LogoProps) {
  const { image, container, text } = sizes[size];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn("relative flex-shrink-0", container)}>
        <Image
          src="/logo.png"
          alt="Just An Agent"
          width={image}
          height={image}
          className="object-contain"
          priority
        />
      </div>
      {showText && (
        <span className={cn("font-semibold", text)}>Just An Agent</span>
      )}
    </div>
  );
}
