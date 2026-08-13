import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  size?: number;
  className?: string;
  rounded?: string;
}

export default function Logo({ size = 36, className, rounded = "rounded-xl" }: LogoProps) {
  return (
    <Image
      src="/novax.png"
      alt="NOVAX"
      width={size}
      height={size}
      className={cn("object-contain shrink-0", rounded, className)}
      priority
    />
  );
}
