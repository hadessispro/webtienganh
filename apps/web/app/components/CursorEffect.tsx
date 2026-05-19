"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function CursorEffect() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const pathname = usePathname();
  const disabled = pathname === "/learn" || pathname === "/admin";

  useEffect(() => {
    if (disabled) {
      document.body.classList.remove("has-custom-cursor", "cursor-hover", "cursor-ready");
      return;
    }

    if (!window.matchMedia("(pointer: fine)").matches) {
      return;
    }

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) {
      return;
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = mouseX;
    let ringY = mouseY;
    let frameId = 0;

    document.body.classList.add("has-custom-cursor");

    const moveCursor = (event: MouseEvent) => {
      mouseX = event.clientX;
      mouseY = event.clientY;
      document.body.classList.add("cursor-ready");
    };

    const setHoverState = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const isInteractive = Boolean(
        target.closest("a, button, input, select, textarea, summary, [role='button'], [tabindex]")
      );
      document.body.classList.toggle("cursor-hover", isInteractive);
    };

    const animate = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      dot.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0) translate(-50%, -50%)`;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      frameId = window.requestAnimationFrame(animate);
    };

    document.addEventListener("mousemove", moveCursor);
    document.addEventListener("mouseover", setHoverState);
    animate();

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener("mousemove", moveCursor);
      document.removeEventListener("mouseover", setHoverState);
      document.body.classList.remove("has-custom-cursor", "cursor-hover", "cursor-ready");
    };
  }, [disabled]);

  if (disabled) {
    return null;
  }

  return (
    <>
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
    </>
  );
}
