import { useState } from "react";

type BusinessImageProps = {
  src: string;
  alt: string;
  className?: string;
  imgClassName?: string;
};

export default function BusinessImage({
  src,
  alt,
  className = "",
  imgClassName = "",
}: BusinessImageProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative overflow-hidden bg-[#17254a] ${className}`}>
      {!failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04] ${imgClassName}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_42%,#354f92_0%,#17254a_42%,#08142e_100%)]">
          <div className="flex flex-col items-center gap-2 text-white/65">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xl">
              +
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.22em]">
              Compass place
            </span>
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#07122d]/35 via-transparent to-white/5" />
    </div>
  );
}