"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SpinWheelSlice } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

// Use a local type to avoid changing the global type definition, which would require changing other files.
type SliceWithTextColor = SpinWheelSlice & { textColor: string };

const slices: SliceWithTextColor[] = [
  { value: 10,  color: "hsl(var(--primary))", textColor: "hsl(var(--primary-foreground))" },
  { value: 200, color: "hsl(var(--accent))", textColor: "black" }, // Use black for light accent color
  { value: 25,  color: "hsl(var(--destructive))", textColor: "hsl(var(--destructive-foreground))" },
  { value: 0,   color: "hsl(var(--secondary))", textColor: "hsl(var(--secondary-foreground))" },
  { value: 50,  color: "hsl(var(--primary))", textColor: "hsl(var(--primary-foreground))" },
  { value: 150, color: "hsl(var(--accent))", textColor: "black" },
  { value: 100, color: "hsl(var(--destructive))", textColor: "hsl(var(--destructive-foreground))" },
  { value: 40,  color: "hsl(var(--secondary))", textColor: "hsl(var(--secondary-foreground))" },
];

const sliceCount = slices.length;
const sliceAngle = 360 / sliceCount;

interface SpinWheelProps {
  onSpinComplete: (value: number) => void;
  onSpinStartCheck: () => boolean;
}

export function SpinWheel({ onSpinComplete, onSpinStartCheck }: SpinWheelProps) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const { toast } = useToast();

  const handleSpin = () => {
    if (isSpinning) return;

    if (!onSpinStartCheck()) {
      toast({
        title: "Spin Limit Reached",
        description: "You have used all your spins for today. Come back tomorrow!",
        variant: "destructive",
      });
      return;
    }

    setIsSpinning(true);
    
    const spins = 8;
    const randomExtraRotation = Math.random() * 360;
    const newRotation = Math.ceil(rotation / 360) * 360 + (spins * 360) + randomExtraRotation;

    setRotation(newRotation);

    setTimeout(() => {
      const finalAngle = newRotation % 360;
      
      // Corrected Calculation:
      // The pointer is at the top (270 degrees). As the wheel spins clockwise (positive rotation),
      // the slice that lands under the pointer is the one that was originally at angle (270 - finalAngle).
      const winningAngle = (270 - finalAngle + 360) % 360;
      const winningSliceIndex = Math.floor(winningAngle / sliceAngle);
      const winningValue = slices[winningSliceIndex].value;

      setIsSpinning(false);
      onSpinComplete(winningValue);
    }, 5000); // Corresponds to animation duration
  };

  const conicGradient = slices.map((slice, i) => `${slice.color} ${i * sliceAngle}deg ${(i + 1) * sliceAngle}deg`).join(", ");

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* The pointer at the top */}
      <div className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20 drop-shadow-md">
        <div className="w-0 h-0 
          border-l-[16px] border-l-transparent
          border-r-[16px] border-r-transparent
          border-t-[24px] border-t-destructive">
        </div>
      </div>
      
      <div className="relative w-72 h-72 md:w-80 md:h-80 drop-shadow-xl">
        <div
          className="relative w-full h-full rounded-full border-[12px] border-card bg-background shadow-inner"
          style={{
              transition: "transform 5s cubic-bezier(0.33, 1, 0.68, 1)",
              transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Colored Slices */}
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `conic-gradient(${conicGradient})` }}
          />

          {/* Pegs between slices */}
          <div className="absolute inset-[-8px]">
            {Array.from({ length: sliceCount }).map((_, i) => (
              <div
                key={`peg-${i}`}
                className="absolute top-0 left-1/2 h-1/2 w-px"
                style={{
                  transform: `rotate(${i * sliceAngle}deg)`,
                  transformOrigin: 'bottom',
                }}
              >
                <div className="w-2 h-2 bg-border rounded-full absolute -top-1 left-1/2 -translate-x-1/2 shadow-sm" />
              </div>
            ))}
          </div>

          {/* Text on slices */}
          {slices.map((slice, index) => {
              const textRotation = index * sliceAngle + sliceAngle / 2;
              return (
              <div
                  key={index}
                  className="absolute w-1/2 h-1/2 top-0 left-1/4 flex items-start justify-center pt-6 text-xl font-bold"
                  style={{
                    transform: `rotate(${textRotation}deg)`,
                    transformOrigin: "50% 100%",
                    color: slice.textColor,
                  }}
              >
                  <span style={{ transform: `rotate(-90deg)` }} className="drop-shadow-sm tracking-tighter">{slice.value}</span>
              </div>
              );
          })}
        </div>

        {/* Spin Button */}
        <div 
          onClick={handleSpin}
          className={cn("absolute inset-0 flex items-center justify-center cursor-pointer z-10")}
        >
          <div className={cn(
            "flex items-center justify-center h-24 w-24 rounded-full bg-card border-4 border-border shadow-lg",
            !isSpinning && "active:scale-95 transition-transform"
          )}>
            <div 
              className={cn(
                "flex items-center justify-center h-[72px] w-[72px] rounded-full font-headline text-2xl shadow-inner",
                isSpinning ? "cursor-wait bg-muted text-muted-foreground" : "bg-destructive text-destructive-foreground"
              )}
            >
                {isSpinning ? "..." : "SPIN"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
