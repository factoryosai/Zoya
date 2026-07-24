import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";

export type TimeOfDay = "auto" | "morning" | "afternoon" | "evening" | "night";

interface DynamicBackgroundProps {
  timeOfDayMode?: TimeOfDay;
  appState?: "idle" | "listening" | "processing" | "speaking";
}

export function getTimeOfDayLabel(mode: TimeOfDay): { label: string; icon: string; colors: string[] } {
  let effective = mode;
  if (mode === "auto") {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) effective = "morning";
    else if (hour >= 12 && hour < 17) effective = "afternoon";
    else if (hour >= 17 && hour < 21) effective = "evening";
    else effective = "night";
  }

  switch (effective) {
    case "morning":
      return {
        label: "Sunrise Golden Hour",
        icon: "🌅",
        colors: ["#f59e0b", "#ec4899", "#3b82f6"]
      };
    case "afternoon":
      return {
        label: "Midday Solar Cyan",
        icon: "☀️",
        colors: ["#06b6d4", "#3b82f6", "#f43f5e"]
      };
    case "evening":
      return {
        label: "Twilight Magenta Dusk",
        icon: "🌆",
        colors: ["#8b5cf6", "#d946ef", "#00f0ff"]
      };
    case "night":
    default:
      return {
        label: "Deep Neural Midnight",
        icon: "🌙",
        colors: ["#00f0ff", "#a855f7", "#fb923c"]
      };
  }
}

interface Node3D {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
}

interface SynapticPulse {
  fromIndex: number;
  toIndex: number;
  progress: number; // 0 to 1
  speed: number;
  color: string;
}

export default function DynamicBackground({ timeOfDayMode = "auto", appState = "idle" }: DynamicBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentPeriod, setCurrentPeriod] = useState<string>("night");

  useEffect(() => {
    const updatePeriod = () => {
      let mode = timeOfDayMode;
      if (mode === "auto") {
        const hour = new Date().getHours();
        if (hour >= 5 && hour < 12) mode = "morning";
        else if (hour >= 12 && hour < 17) mode = "afternoon";
        else if (hour >= 17 && hour < 21) mode = "evening";
        else mode = "night";
      }
      setCurrentPeriod(mode);
    };

    updatePeriod();
    const interval = setInterval(updatePeriod, 60000);
    return () => clearInterval(interval);
  }, [timeOfDayMode]);

  // Canvas Neural Network Visual Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Color Palette matching the screenshot (Cyan, Vibrant Purple, Bright Orange/Amber, Electric Blue)
    const colors = [
      "#00f0ff", // Bright Cyan
      "#3b82f6", // Electric Blue
      "#a855f7", // Violet Purple
      "#ec4899", // Neon Magenta
      "#fb923c", // Warm Glowing Orange
      "#f59e0b", // Gold Sparkle
    ];

    // Generate Nodes
    const nodeCount = Math.min(Math.floor((width * height) / 14000), 110);
    const nodes: Node3D[] = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.4, // z-scale for perspective depth
        vx: (Math.random() - 0.5) * 0.6,
        vy: (Math.random() - 0.5) * 0.6,
        vz: (Math.random() - 0.5) * 0.002,
        radius: Math.random() * 2.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    // Synaptic Pulses list
    const pulses: SynapticPulse[] = [];

    // Helper to trigger new synaptic firing pulse
    const triggerPulse = () => {
      if (nodes.length < 2) return;
      const fromIndex = Math.floor(Math.random() * nodes.length);
      const n1 = nodes[fromIndex];
      // Find a nearby node
      const candidates: number[] = [];
      nodes.forEach((n2, idx) => {
        if (idx !== fromIndex) {
          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 220) candidates.push(idx);
        }
      });

      if (candidates.length > 0) {
        const toIndex = candidates[Math.floor(Math.random() * candidates.length)];
        pulses.push({
          fromIndex,
          toIndex,
          progress: 0,
          speed: appState === "speaking" ? 0.035 : appState === "processing" ? 0.045 : 0.018,
          color: n1.color,
        });
      }
    };

    // Render loop
    let lastPulseTime = 0;

    const render = (time: number) => {
      // Dynamic dark space canvas background with radial cosmic aura
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, width, height);

      // Deep central glowing aura (Cyan / Purple blend)
      const centerGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.45,
        10,
        width * 0.5,
        height * 0.45,
        width * 0.7
      );
      centerGlow.addColorStop(0, "rgba(15, 23, 50, 0.6)");
      centerGlow.addColorStop(0.5, "rgba(8, 14, 32, 0.8)");
      centerGlow.addColorStop(1, "rgba(3, 7, 18, 0.98)");
      ctx.fillStyle = centerGlow;
      ctx.fillRect(0, 0, width, height);

      // Periodically generate synaptic pulses depending on voice state
      const pulseInterval = appState === "speaking" ? 120 : appState === "processing" ? 80 : 350;
      if (time - lastPulseTime > pulseInterval) {
        triggerPulse();
        if (appState === "speaking" || appState === "processing") {
          triggerPulse(); // Extra density when active
        }
        lastPulseTime = time;
      }

      // Update Node Positions
      nodes.forEach((node) => {
        const speedMult = appState === "speaking" ? 1.4 : appState === "listening" ? 1.2 : 1.0;
        node.x += node.vx * speedMult;
        node.y += node.vy * speedMult;
        node.pulse += node.pulseSpeed * (appState === "speaking" ? 2 : 1);

        // Boundary bounce
        if (node.x < -30) node.x = width + 30;
        if (node.x > width + 30) node.x = -30;
        if (node.y < -30) node.y = height + 30;
        if (node.y > height + 30) node.y = -30;
      });

      // Draw Connection Lines (Laser Fibers)
      const maxDistance = 210;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n1.x - n2.x;
          const dy = n1.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDistance) {
            const alpha = (1 - dist / maxDistance) * 0.65 * Math.min(n1.z, n2.z);
            if (alpha <= 0.02) continue;

            // Gradient line connecting two colorful nodes
            const grad = ctx.createLinearGradient(n1.x, n1.y, n2.x, n2.y);
            grad.addColorStop(0, n1.color);
            grad.addColorStop(1, n2.color);

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = grad;
            ctx.lineWidth = (1 - dist / maxDistance) * 1.8 * ((n1.z + n2.z) / 2);
            ctx.shadowBlur = 8;
            ctx.shadowColor = n1.color;

            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      }

      // Update and Draw Synaptic Pulses (Firing Action Potentials)
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pulse = pulses[p];
        pulse.progress += pulse.speed;

        if (pulse.progress >= 1) {
          pulses.splice(p, 1);
          continue;
        }

        const n1 = nodes[pulse.fromIndex];
        const n2 = nodes[pulse.toIndex];
        if (!n1 || !n2) continue;

        const px = n1.x + (n2.x - n1.x) * pulse.progress;
        const py = n1.y + (n2.y - n1.y) * pulse.progress;

        ctx.save();
        ctx.beginPath();
        ctx.arc(px, py, Math.max(0.5, 3.5 * n1.z), 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 16;
        ctx.shadowColor = pulse.color;
        ctx.fill();

        // Trailing glow tail
        ctx.beginPath();
        const tailX = n1.x + (n2.x - n1.x) * Math.max(0, pulse.progress - 0.12);
        const tailY = n1.y + (n2.y - n1.y) * Math.max(0, pulse.progress - 0.12);
        const gradTail = ctx.createLinearGradient(tailX, tailY, px, py);
        gradTail.addColorStop(0, "transparent");
        gradTail.addColorStop(1, pulse.color);
        ctx.strokeStyle = gradTail;
        ctx.lineWidth = 2.5;
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.restore();
      }

      // Draw Nodes (Neurons)
      nodes.forEach((node) => {
        const baseRadius = Math.max(0.5, node.radius * node.z + Math.sin(node.pulse) * 0.8);
        const auraRadius = Math.max(0.5, baseRadius * 3.5);
        const coreRadius = Math.max(1, baseRadius);
        const ringRadius = Math.max(2, baseRadius * 1.5);

        ctx.save();

        // Outer Aura Glow
        ctx.beginPath();
        ctx.arc(node.x, node.y, auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = node.color;
        ctx.globalAlpha = Math.max(0.05, 0.18 + Math.sin(node.pulse) * 0.08);
        ctx.fill();

        // Core Node
        ctx.beginPath();
        ctx.arc(node.x, node.y, coreRadius, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 14;
        ctx.shadowColor = node.color;
        ctx.globalAlpha = 0.9;
        ctx.fill();

        // Color Ring
        ctx.beginPath();
        ctx.arc(node.x, node.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.6;
        ctx.stroke();

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [appState]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 bg-[#030712]">
      {/* Dynamic 3D Neural Matrix Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Subtle Vignette Frame Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_40%,_rgba(3,7,18,0.75)_100%)] pointer-events-none" />
    </div>
  );
}
