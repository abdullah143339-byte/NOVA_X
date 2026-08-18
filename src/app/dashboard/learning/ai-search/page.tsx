"use client";

import { useState, useRef } from "react";
import Button from "@/components/ui/Button";
import GlassCard from "@/components/ui/GlassCard";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { PageHeader, LearningNav } from "@/components/learning/LearningShared";
import {
  Brain,
  Search,
  Loader2,
  Image as ImageIcon,
  BarChart3,
  Lightbulb,
  Star,
  CheckCircle,
  TrendingUp,
  Code,
  Atom,
} from "lucide-react";

interface SearchResult {
  id: string;
  title: string;
  summary: string;
  diagram: string;
  imageUrl: string;
  keyPoints: string[];
  relatedTopics: string[];
  sourceIcon: React.ReactNode;
}

const deepSearchResults: Record<string, SearchResult> = {
  "default": {
    id: "r0",
    title: "AI Search Result",
    summary: "Based on the knowledge graph, here's a comprehensive explanation with visual aids and key concepts.",
    diagram: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:400px;height:auto"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#6D28D9"/></linearGradient><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs><rect x="10" y="10" width="380" height="180" rx="12" fill="#1C1C2E"/><text x="200" y="35" text-anchor="middle" fill="#E2E8F0" font-size="13" font-weight="bold">KNOWLEDGE GRAPH — Concept Map</text><circle cx="80" cy="100" r="28" fill="url(#g1)" opacity="0.9"/><text x="80" y="105" text-anchor="middle" fill="#FFF" font-size="9" font-weight="bold">CONCEPT</text><circle cx="200" cy="80" r="25" fill="url(#g2)" opacity="0.9"/><text x="200" y="85" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">ANALYSIS</text><circle cx="320" cy="100" r="25" fill="url(#g1)" opacity="0.9"/><text x="320" y="105" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">OUTPUT</text><line x1="108" y1="95" x2="175" y2="82" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="4,3"/><line x1="225" y1="82" x2="295" y2="95" stroke="#10B981" stroke-width="1.5" stroke-dasharray="4,3"/><text x="140" y="155" fill="#8B5CF6" font-size="9">Phase 1</text><text x="260" y="155" fill="#10B981" font-size="9">Phase 2</text></svg>`,
    imageUrl: "",
    keyPoints: [
      "Understanding begins with foundational concepts",
      "Analysis phase connects theory to practice",
      "Output validates comprehension",
    ],
    relatedTopics: ["Foundations", "Advanced Concepts", "Practical Applications"],
    sourceIcon: <Brain className="w-4 h-4" />,
  },
  "neural": {
    id: "r1",
    title: "How Neural Networks Learn — Visual Breakdown",
    summary: "Neural networks learn by adjusting weights through backpropagation. Each layer extracts increasingly abstract features from the input data.",
    diagram: `<svg viewBox="0 0 500 220" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;height:auto"><defs><linearGradient id="nn1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#8B5CF6"/><stop offset="100%" stop-color="#6D28D9"/></linearGradient><linearGradient id="nn2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#10B981"/><stop offset="100%" stop-color="#059669"/></linearGradient><linearGradient id="nn3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#F59E0B"/><stop offset="100%" stop-color="#D97706"/></linearGradient></defs><rect x="10" y="10" width="480" height="200" rx="12" fill="#1C1C2E"/><text x="250" y="32" text-anchor="middle" fill="#E2E8F0" font-size="12" font-weight="bold">NEURAL NETWORK ARCHITECTURE</text><g font-size="7" fill="#E2E8F0" text-anchor="middle"><circle cx="70" cy="70" r="8" fill="url(#nn1)"/><circle cx="70" cy="100" r="8" fill="url(#nn1)"/><circle cx="70" cy="130" r="8" fill="url(#nn1)"/><circle cx="70" cy="160" r="8" fill="url(#nn1)"/><text x="70" y="185" fill="#A1A1AA" font-size="7">INPUT</text><circle cx="170" cy="60" r="8" fill="url(#nn2)"/><circle cx="170" cy="90" r="8" fill="url(#nn2)"/><circle cx="170" cy="120" r="8" fill="url(#nn2)"/><circle cx="170" cy="150" r="8" fill="url(#nn2)"/><circle cx="170" cy="180" r="8" fill="url(#nn2)"/><text x="170" y="196" fill="#A1A1AA" font-size="7">HIDDEN</text><circle cx="270" cy="65" r="8" fill="url(#nn2)"/><circle cx="270" cy="95" r="8" fill="url(#nn2)"/><circle cx="270" cy="125" r="8" fill="url(#nn2)"/><circle cx="270" cy="155" r="8" fill="url(#nn2)"/><circle cx="270" cy="185" r="8" fill="url(#nn2)"/><text x="270" y="196" fill="#A1A1AA" font-size="7">HIDDEN</text><circle cx="370" cy="70" r="8" fill="url(#nn3)"/><circle cx="370" cy="100" r="8" fill="url(#nn3)"/><circle cx="370" cy="130" r="8" fill="url(#nn3)"/><circle cx="370" cy="160" r="8" fill="url(#nn3)"/><text x="370" y="185" fill="#A1A1AA" font-size="7">OUTPUT</text><line x1="78" y1="75" x2="162" y2="62" stroke="#8B5CF6" stroke-width="0.7" opacity="0.4"/><line x1="78" y1="95" x2="162" y2="62" stroke="#8B5CF6" stroke-width="0.7" opacity="0.4"/><line x1="78" y1="115" x2="162" y2="62" stroke="#8B5CF6" stroke-width="0.7" opacity="0.4"/></g></svg>`,
    imageUrl: "",
    keyPoints: [
      "Input layer receives raw data (images, text, numbers)",
      "Hidden layers extract features using weighted connections",
      "Output layer produces final prediction or classification",
      "Backpropagation adjusts weights to minimize error",
    ],
    relatedTopics: ["Backpropagation", "Activation Functions", "CNN vs RNN"],
    sourceIcon: <Brain className="w-4 h-4" />,
  },
  "sorting": {
    id: "r2",
    title: "Sorting Algorithms — Time & Space Complexity",
    summary: "Different sorting algorithms trade off between time complexity, space complexity, and stability. Here's how they compare:",
    diagram: `<svg viewBox="0 0 500 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;height:auto"><rect x="10" y="10" width="480" height="230" rx="12" fill="#1C1C2E"/><text x="250" y="35" text-anchor="middle" fill="#E2E8F0" font-size="12" font-weight="bold">SORTING ALGORITHM COMPARISON</text><g font-size="9" fill="#E2E8F0"><text x="30" y="70">Algorithm</text><text x="200" y="70">Best</text><text x="270" y="70">Average</text><text x="340" y="70">Worst</text><text x="420" y="70">Space</text></g><line x1="20" y1="80" x2="480" y2="80" stroke="#2A2A3E" stroke-width="1"/><g font-size="9" fill="#A1A1AA"><text x="30" y="105">Quick Sort</text><text x="200" y="105" fill="#10B981">O(n log n)</text><text x="270" y="105" fill="#10B981">O(n log n)</text><text x="340" y="105" fill="#F59E0B">O(n²)</text><text x="420" y="105" fill="#10B981">O(log n)</text></g><g font-size="9" fill="#A1A1AA"><text x="30" y="135">Merge Sort</text><text x="200" y="135" fill="#10B981">O(n log n)</text><text x="270" y="135" fill="#10B981">O(n log n)</text><text x="340" y="135" fill="#10B981">O(n log n)</text><text x="420" y="135" fill="#F59E0B">O(n)</text></g><g font-size="9" fill="#A1A1AA"><text x="30" y="165">Bubble Sort</text><text x="200" y="165" fill="#10B981">O(n)</text><text x="270" y="165" fill="#F59E0B">O(n²)</text><text x="340" y="165" fill="#F59E0B">O(n²)</text><text x="420" y="165" fill="#10B981">O(1)</text></g><line x1="190" y1="90" x2="190" y2="175" stroke="#2A2A3E" stroke-width="1"/><line x1="260" y1="90" x2="260" y2="175" stroke="#2A2A3E" stroke-width="1"/><line x1="330" y1="90" x2="330" y2="175" stroke="#2A2A3E" stroke-width="1"/><line x1="400" y1="90" x2="400" y2="175" stroke="#2A2A3E" stroke-width="1"/><text x="250" y="210" text-anchor="middle" fill="#8B5CF6" font-size="8">Best: O(n log n) | Worst: O(n²) — Choose wisely based on data size</text></svg>`,
    imageUrl: "",
    keyPoints: [
      "Quick Sort: Fast average but O(n²) worst-case (rare with good pivot selection)",
      "Merge Sort: Consistent O(n log n) but uses extra memory",
      "Bubble Sort: Simple but impractical for large datasets",
      "Choose based on data size, stability needs, and memory constraints",
    ],
    relatedTopics: ["Big O Notation", "Search Algorithms", "Data Structures"],
    sourceIcon: <Code className="w-4 h-4" />,
  },
  "quantum": {
    id: "r3",
    title: "Quantum Computing — Superposition & Entanglement",
    summary: "Quantum computing leverages quantum mechanical phenomena to process information in fundamentally new ways. Qubits can exist in superposition, enabling exponential parallelism.",
    diagram: `<svg viewBox="0 0 500 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;height:auto"><rect x="10" y="10" width="480" height="230" rx="12" fill="#1C1C2E"/><text x="250" y="35" text-anchor="middle" fill="#E2E8F0" font-size="12" font-weight="bold">QUANTUM vs CLASSICAL COMPUTING</text><g><circle cx="120" cy="100" r="40" fill="none" stroke="#8B5CF6" stroke-width="2" stroke-dasharray="5,3"/><text x="120" y="95" text-anchor="middle" fill="#8B5CF6" font-size="9" font-weight="bold">CLASSICAL</text><text x="120" y="115" text-anchor="middle" fill="#A1A1AA" font-size="8">Bit: 0 or 1</text><circle cx="120" cy="100" r="3" fill="#8B5CF6"/></g><g><circle cx="380" cy="100" r="40" fill="none" stroke="#10B981" stroke-width="2"/><circle cx="380" cy="100" r="40" fill="url(#nn1)" opacity="0.1"/><text x="380" y="90" text-anchor="middle" fill="#10B981" font-size="9" font-weight="bold">QUANTUM</text><text x="380" y="108" text-anchor="middle" fill="#A1A1AA" font-size="8">Qubit: 0 AND 1</text><circle cx="370" cy="95" r="2" fill="#10B981" opacity="0.6"/><circle cx="385" cy="105" r="2" fill="#10B981" opacity="0.6"/><circle cx="375" cy="108" r="2" fill="#10B981" opacity="0.6"/><circle cx="390" cy="92" r="2" fill="#10B981" opacity="0.6"/></g><line x1="160" y1="85" x2="340" y2="85" stroke="#2A2A3E" stroke-width="1.5" stroke-dasharray="6,4"/><text x="250" y="80" text-anchor="middle" fill="#A1A1AA" font-size="7">SUPERPOSITION</text><g font-size="8" fill="#A1A1AA"><text x="250" y="165" text-anchor="middle">N classical bits → 2^N states</text><text x="250" y="185" text-anchor="middle">N qubits → ALL 2^N states SIMULTANEOUSLY</text></g><text x="250" y="220" text-anchor="middle" fill="#F59E0B" font-size="8">Exponential speedup for specific problems</text></svg>`,
    imageUrl: "",
    keyPoints: [
      "Superposition allows qubits to be in multiple states simultaneously",
      "Entanglement links qubits so measuring one instantly affects its pair",
      "Quantum algorithms can solve certain problems exponentially faster",
      "Applications: cryptography, drug discovery, optimization",
    ],
    relatedTopics: ["Quantum Gates", "Shor's Algorithm", "Quantum Cryptography"],
    sourceIcon: <Atom className="w-4 h-4" />,
  },
  "gradient": {
    id: "r4",
    title: "Gradient Descent — Finding the Minimum",
    summary: "Gradient descent iteratively adjusts parameters to minimize a loss function. The learning rate controls step size, and different variants (SGD, Adam) optimize convergence.",
    diagram: `<svg viewBox="0 0 500 250" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:500px;height:auto"><rect x="10" y="10" width="480" height="230" rx="12" fill="#1C1C2E"/><text x="250" y="35" text-anchor="middle" fill="#E2E8F0" font-size="12" font-weight="bold">GRADIENT DESCENT VISUALIZATION</text><path d="M50,200 Q150,40 250,120 Q350,180 450,60" fill="none" stroke="#8B5CF6" stroke-width="2" opacity="0.6"/><circle cx="120" cy="125" r="5" fill="#F59E0B"/><text x="120" y="120" text-anchor="middle" fill="#F59E0B" font-size="7">Start</text><circle cx="190" cy="108" r="4" fill="#F59E0B" opacity="0.8"/><circle cx="250" cy="118" r="3" fill="#F59E0B" opacity="0.6"/><circle cx="380" cy="96" r="4" fill="#10B981" opacity="0.8"/><circle cx="440" cy="68" r="5" fill="#10B981"/><text x="440" y="63" text-anchor="middle" fill="#10B981" font-size="7">Minimum</text><line x1="120" y1="130" x2="190" y2="113" stroke="#F59E0B" stroke-width="1" stroke-dasharray="3,2"/><line x1="250" y1="122" x2="380" y2="100" stroke="#10B981" stroke-width="1" stroke-dasharray="3,2"/><text x="250" y="200" text-anchor="middle" fill="#8B5CF6" font-size="8">Iterations →</text><text x="30" y="50" fill="#A1A1AA" font-size="7">Loss ↑</text><text x="480" y="210" fill="#A1A1AA" font-size="7">Time →</text><line x1="20" y1="45" x2="20" y2="215" stroke="#2A2A3E" stroke-width="1"/><line x1="20" y1="215" x2="480" y2="215" stroke="#2A2A3E" stroke-width="1"/><text x="250" y="240" text-anchor="middle" fill="#10B981" font-size="8">SGD: Step-by-step toward global minimum</text></svg>`,
    imageUrl: "",
    keyPoints: [
      "Learning rate determines step size — too big overshoots, too small is slow",
      "Stochastic GD uses random samples for faster iterations",
      "Adam optimizer adapts learning rates per parameter for better convergence",
      "Local minima can trap vanilla GD; momentum-based methods escape them",
    ],
    relatedTopics: ["Loss Functions", "Optimizers", "Learning Rate Scheduling"],
    sourceIcon: <TrendingUp className="w-4 h-4" />,
  },
  "transformer": {
    id: "r5",
    title: "Transformer Architecture — Attention Is All You Need",
    summary: "The Transformer uses self-attention to process all input tokens in parallel, capturing relationships between distant positions without the sequential bottleneck of RNNs.",
    diagram: `<svg viewBox="0 0 520 260" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:520px;height:auto"><rect x="10" y="10" width="500" height="240" rx="12" fill="#1C1C2E"/><text x="260" y="32" text-anchor="middle" fill="#E2E8F0" font-size="11" font-weight="bold">TRANSFORMER ARCHITECTURE</text><rect x="40" y="50" width="90" height="40" rx="8" fill="url(#nn1)" opacity="0.8"/><text x="85" y="75" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">INPUT</text><rect x="40" y="110" width="90" height="40" rx="8" fill="url(#nn2)" opacity="0.8"/><text x="85" y="135" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">SELF-ATTENTION</text><rect x="40" y="170" width="90" height="40" rx="8" fill="url(#nn3)" opacity="0.8"/><text x="85" y="195" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">FEED FORWARD</text><rect x="190" y="110" width="90" height="40" rx="8" fill="url(#nn1)" opacity="0.8"/><text x="235" y="135" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">ADD & NORM</text><rect x="340" y="170" width="90" height="40" rx="8" fill="url(#nn2)" opacity="0.8"/><text x="385" y="195" text-anchor="middle" fill="#FFF" font-size="8" font-weight="bold">LINEAR</text><line x1="85" y1="90" x2="85" y2="108" stroke="#8B5CF6" stroke-width="1.5"/><line x1="85" y1="150" x2="85" y2="168" stroke="#8B5CF6" stroke-width="1.5"/><line x1="130" y1="130" x2="188" y2="130" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="4,2"/><line x1="280" y1="130" x2="385" y2="170" stroke="#8B5CF6" stroke-width="1.5" stroke-dasharray="4,2"/><text x="85" y="240" text-anchor="middle" fill="#A1A1AA" font-size="7">One Transformer Block (repeated N times)</text></svg>`,
    imageUrl: "",
    keyPoints: [
      "Self-attention computes relevance between every pair of tokens",
      "Multi-head attention runs parallel attention for different representation subspaces",
      "Positional encoding preserves token order without recurrence",
      "Scale to billions of parameters, enabling GPT and BERT models",
    ],
    relatedTopics: ["BERT", "GPT", "Attention Visualization"],
    sourceIcon: <Brain className="w-4 h-4" />,
  },
};

  type SearchMethod = "auto" | "simple" | "sorting" | "quantum" | "transformers";
  type SearchLang = "urdu" | "punjabi" | "roman-urdu" | "hindi" | "english";

  const generateDiagram = (topic: string): string => {
    const lower = topic.toLowerCase();
    const title = topic.replace(/[<>]/g, '').slice(0, 55) || "Concept Overview";

    const diagramType = (() => {
      if (lower.includes("sort") || lower.includes("algorithm") || lower.includes("bubble") || lower.includes("quick") || lower.includes("merge")) {
        return "sorting";
      } else if (lower.includes("quantum") || lower.includes("qubit") || lower.includes("superposition")) {
        return "quantum";
      } else if (lower.includes("neural") || lower.includes("network") || lower.includes("deep learning") || lower.includes("transformer") || lower.includes("attention") || lower.includes("gpt") || lower.includes("bert")) {
        return "transformers";
      }
      return "concept";
    })();

    if (diagramType === "sorting") {
      return `<svg viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;height:auto"><defs><linearGradient id="st1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#059669"/><stop offset="100%" stop-color="#10B981"/></linearGradient><linearGradient id="st2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#D97706"/><stop offset="100%" stop-color="#F59E0B"/></linearGradient></defs><rect x="10" y="10" width="680" height="340" rx="16" fill="#F8FAFC"/><rect x="10" y="10" width="680" height="44" rx="16" fill="#1E3A5F"/><rect x="10" y="40" width="680" height="14" fill="#1E3A5F"/><text x="350" y="38" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">${title}</text><g font-size="12" fill="#1E3A5F" font-weight="bold"><text x="30" y="80">Algorithm</text><text x="185" y="80">Best</text><text x="270" y="80">Average</text><text x="360" y="80">Worst</text><text x="445" y="80">Space</text><text x="530" y="80">Stable?</text><text x="610" y="80">Use</text></g><line x1="20" y1="90" x2="680" y2="90" stroke="#CBD5E1" stroke-width="1"/><g font-size="11" fill="#475569"><text x="30" y="120">Quick Sort</text><text x="185" y="120" fill="#059669">O(n log n)</text><text x="270" y="120" fill="#059669">O(n log n)</text><text x="360" y="120" fill="#D97706">O(n\u00B2)</text><text x="445" y="120" fill="#059669">O(log n)</text><text x="530" y="120" fill="#059669">No</text><text x="610" y="120">Large</text></g><g font-size="11" fill="#475569"><text x="30" y="150">Merge Sort</text><text x="185" y="150" fill="#059669">O(n log n)</text><text x="270" y="150" fill="#059669">O(n log n)</text><text x="360" y="150" fill="#059669">O(n log n)</text><text x="445" y="150" fill="#D97706">O(n)</text><text x="530" y="150" fill="#059669">Yes</text><text x="610" y="150">Stable</text></g><g font-size="11" fill="#475569"><text x="30" y="180">Bubble Sort</text><text x="185" y="180" fill="#059669">O(n)</text><text x="270" y="180" fill="#D97706">O(n\u00B2)</text><text x="360" y="180" fill="#D97706">O(n\u00B2)</text><text x="445" y="180" fill="#059669">O(1)</text><text x="530" y="180" fill="#059669">Yes</text><text x="610" y="180">Small</text></g><g font-size="11" fill="#475569"><text x="30" y="210">Insertion</text><text x="185" y="210" fill="#059669">O(n)</text><text x="270" y="210" fill="#D97706">O(n\u00B2)</text><text x="360" y="210" fill="#D97706">O(n\u00B2)</text><text x="445" y="210" fill="#059669">O(1)</text><text x="530" y="210" fill="#059669">Yes</text><text x="610" y="210">Small</text></g><g font-size="11" fill="#475569"><text x="30" y="240">Selection</text><text x="185" y="240" fill="#D97706">O(n\u00B2)</text><text x="270" y="240" fill="#D97706">O(n\u00B2)</text><text x="360" y="240" fill="#D97706">O(n\u00B2)</text><text x="445" y="240" fill="#059669">O(1)</text><text x="530" y="240" fill="#D97706">No</text><text x="610" y="240">Simple</text></g><line x1="175" y1="98" x2="175" y2="255" stroke="#E2E8F0" stroke-width="1"/><line x1="260" y1="98" x2="260" y2="255" stroke="#E2E8F0" stroke-width="1"/><line x1="350" y1="98" x2="350" y2="255" stroke="#E2E8F0" stroke-width="1"/><line x1="435" y1="98" x2="435" y2="255" stroke="#E2E8F0" stroke-width="1"/><line x1="520" y1="98" x2="520" y2="255" stroke="#E2E8F0" stroke-width="1"/><line x1="600" y1="98" x2="600" y2="255" stroke="#E2E8F0" stroke-width="1"/><rect x="40" y="275" width="620" height="50" rx="8" fill="#EFF6FF"/><text x="350" y="296" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">Key Insight: O(n log n) is optimal for comparison-based sorting</text><text x="350" y="316" text-anchor="middle" fill="#475569" font-size="11">Stable sorts preserve original order of equal elements</text></svg>`;
    }

    if (diagramType === "quantum") {
      return `<svg viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;height:auto"><defs><linearGradient id="qg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A5F"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><rect x="10" y="10" width="680" height="340" rx="16" fill="#F8FAFC"/><rect x="10" y="10" width="680" height="44" rx="16" fill="url(#qg1)"/><rect x="10" y="40" width="680" height="14" fill="url(#qg1)"/><text x="350" y="38" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">${title}</text><g font-size="13" fill="#1E3A5F" text-anchor="middle" font-weight="bold"><text x="120" y="85">Classical Bit</text><text x="350" y="85">Qubit</text><text x="580" y="85">Superposition</text></g><g font-size="14" fill="#475569" text-anchor="middle"><text x="120" y="118">0 or 1</text><text x="350" y="118">\u03B1|0\u27E9 + \u03B2|1\u27E9</text><text x="580" y="118">Both states at once</text></g><line x1="200" y1="70" x2="200" y2="140" stroke="#CBD5E1" stroke-width="1.5"/><line x1="450" y1="70" x2="450" y2="140" stroke="#CBD5E1" stroke-width="1.5"/><rect x="35" y="160" width="170" height="42" rx="8" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="1.5"/><text x="120" y="186" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">1 bit = 1 value</text><rect x="265" y="160" width="170" height="42" rx="8" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="1.5"/><text x="350" y="186" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">1 qubit = 2 values</text><rect x="495" y="160" width="170" height="42" rx="8" fill="#1E3A5F"/><text x="580" y="186" text-anchor="middle" fill="#FFF" font-size="12" font-weight="bold">N qubits = 2\u207F values</text><line x1="20" y1="220" x2="680" y2="220" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="6,3"/><text x="350" y="242" text-anchor="middle" fill="#1E3A5F" font-size="13" font-weight="bold">Key Quantum Properties</text><g font-size="11" fill="#475569"><text x="40" y="268">\u2022 Superposition: Multiple states exist simultaneously</text><text x="40" y="288">\u2022 Entanglement: Qubits linked instantly across any distance</text><text x="40" y="308">\u2022 Interference: Amplify correct answers, cancel wrong ones</text><text x="40" y="328">\u2022 Key Applications: Cryptography, Drug Discovery, Optimization</text></g></svg>`;
    }

    if (diagramType === "transformers") {
      return `<svg viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;height:auto"><defs><linearGradient id="ng1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A5F"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><rect x="10" y="10" width="680" height="340" rx="16" fill="#F8FAFC"/><rect x="10" y="10" width="680" height="44" rx="16" fill="url(#ng1)"/><rect x="10" y="40" width="680" height="14" fill="url(#ng1)"/><text x="350" y="38" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">${title}</text><g font-size="12" fill="#1E3A5F" text-anchor="middle" font-weight="bold"><text x="80" y="80">Input</text><text x="230" y="80">Self-Attention</text><text x="390" y="80">Feed Forward</text><text x="540" y="80">Output</text></g><rect x="30" y="95" width="100" height="36" rx="8" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="1.5"/><text x="80" y="118" text-anchor="middle" fill="#1E3A5F" font-size="11" font-weight="bold">Tokenize</text><rect x="180" y="95" width="100" height="36" rx="8" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="1.5"/><text x="230" y="118" text-anchor="middle" fill="#1E3A5F" font-size="11" font-weight="bold">Attention</text><rect x="340" y="95" width="100" height="36" rx="8" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="1.5"/><text x="390" y="118" text-anchor="middle" fill="#1E3A5F" font-size="11" font-weight="bold">FFN</text><rect x="490" y="95" width="100" height="36" rx="8" fill="#1E3A5F"/><text x="540" y="118" text-anchor="middle" fill="#FFF" font-size="11" font-weight="bold">Predict</text><line x1="130" y1="113" x2="178" y2="113" stroke="#2563EB" stroke-width="2"/><line x1="280" y1="113" x2="338" y2="113" stroke="#2563EB" stroke-width="2"/><line x1="440" y1="113" x2="488" y2="113" stroke="#2563EB" stroke-width="2"/><line x1="20" y1="155" x2="680" y2="155" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="6,3"/><text x="350" y="178" text-anchor="middle" fill="#1E3A5F" font-size="13" font-weight="bold">How Self-Attention Works</text><g font-size="11" fill="#475569"><text x="40" y="205">\u2022 Each token looks at ALL other tokens in parallel</text><text x="40" y="225">\u2022 Query, Key, Value vectors determine relevance scores</text><text x="40" y="245">\u2022 Multi-Head: 8-32 parallel attention views</text><text x="40" y="265">\u2022 Positional Encoding preserves word order</text><text x="40" y="285">\u2022 Stack N layers for deep understanding</text></g><text x="350" y="330" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">Powering: GPT-4, BERT, Gemini, Claude, Llama</text></svg>`;
    }

    return `<svg viewBox="0 0 700 360" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:700px;height:auto"><defs><linearGradient id="dg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1E3A5F"/><stop offset="100%" stop-color="#2563EB"/></linearGradient></defs><rect x="10" y="10" width="680" height="340" rx="16" fill="#F8FAFC"/><rect x="10" y="10" width="680" height="44" rx="16" fill="url(#dg1)"/><rect x="10" y="40" width="680" height="14" fill="url(#dg1)"/><text x="350" y="38" text-anchor="middle" fill="#FFFFFF" font-size="16" font-weight="bold">${title}</text><g font-size="13" fill="#1E3A5F" text-anchor="middle" font-weight="bold"><text x="120" y="85">Learn Concept</text><text x="350" y="85">Understand Deeply</text><text x="580" y="85">Apply Knowledge</text></g><rect x="40" y="100" width="160" height="55" rx="10" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="2"/><text x="120" y="125" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">Read &amp; Explore</text><text x="120" y="143" text-anchor="middle" fill="#475569" font-size="10">Gather information</text><rect x="270" y="100" width="160" height="55" rx="10" fill="#DBEAFE" stroke="#1E3A5F" stroke-width="2"/><text x="350" y="125" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">Analyze &amp; Connect</text><text x="350" y="143" text-anchor="middle" fill="#475569" font-size="10">Find relationships</text><rect x="500" y="100" width="160" height="55" rx="10" fill="#1E3A5F"/><text x="580" y="125" text-anchor="middle" fill="#FFF" font-size="12" font-weight="bold">Practice &amp; Teach</text><text x="580" y="143" text-anchor="middle" fill="#DBEAFE" font-size="10">Reinforce learning</text><line x1="200" y1="127" x2="268" y2="127" stroke="#2563EB" stroke-width="2.5"/><line x1="430" y1="127" x2="498" y2="127" stroke="#2563EB" stroke-width="2.5"/><line x1="20" y1="175" x2="680" y2="175" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="6,3"/><text x="350" y="198" text-anchor="middle" fill="#1E3A5F" font-size="13" font-weight="bold">Key Principles for Effective Learning</text><g font-size="11" fill="#475569"><text x="40" y="225">\u2022 Active Recall: Test yourself regularly instead of just re-reading</text><text x="40" y="245">\u2022 Spaced Repetition: Review material at increasing intervals</text><text x="40" y="265">\u2022 Elaboration: Explain concepts in your own words</text><text x="40" y="285">\u2022 Interleaving: Mix different topics during practice</text></g><text x="350" y="330" text-anchor="middle" fill="#1E3A5F" font-size="12" font-weight="bold">Master any topic by combining these four principles</text></svg>`;
  };

export default function AISearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [aiResult, setAiResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [searchMethod, setSearchMethod] = useState<SearchMethod>("auto");
  const [searchLang, setSearchLang] = useState<SearchLang>("english");
  const [feedback, setFeedback] = useState<"yes" | "no" | null>(null);

  const handleDeepSearch = async (query: string, method: SearchMethod = searchMethod) => {
    if (!query.trim() || isSearching) return;
    setIsSearching(true);
    setAiResult(null);

    const lower = query.toLowerCase();
    let resultKey = "default";

    if (lower.includes("neural") || lower.includes("network") || lower.includes("deep learning")) {
      resultKey = "neural";
    } else if (lower.includes("sort") || lower.includes("algorithm") || lower.includes("bubble") || lower.includes("quick")) {
      resultKey = "sorting";
    } else if (lower.includes("quantum") || lower.includes("qubit")) {
      resultKey = "quantum";
    } else if (lower.includes("gradient") || lower.includes("descent") || lower.includes("optimization")) {
      resultKey = "gradient";
    } else if (lower.includes("transformer") || lower.includes("attention") || lower.includes("bert") || lower.includes("gpt")) {
      resultKey = "transformer";
    }

    try {
      const styleGuide: Record<string, string> = {
        auto: "Explain in a clear, straightforward way",
        simple: "Explain in the simplest possible terms, like teaching a beginner. Use everyday analogies.",
        sorting: "Explain using sorting/comparison approach. Organize information in structured tables, compare different aspects side by side.",
        quantum: "Explain using quantum concepts as metaphors. Show how things can exist in multiple states simultaneously (superposition of ideas).",
        transformers: "Explain using neural network / attention mechanism analogies. Show how different parts connect and relate to each other.",
      };

      const styleInstruction = styleGuide[method] || styleGuide.auto;

      const langMap: Record<string, string> = {
        urdu: "Respond in Urdu language (Urdu script, نستعلیق). Use proper Urdu sentences.",
        punjabi: "Respond in Punjabi language (Shahmukhi or Gurmukhi script). Use proper Punjabi sentences.",
        "roman-urdu": "Respond in Roman Urdu (Urdu language written with English/Roman alphabets). Use simple everyday Urdu words in English script. Example: 'Yeh concept bahut important hai'.",
        hindi: "Respond in Hindi language (Devnagari script).",
        english: "Respond in English language only.",
      };
      const langInstruction = langMap[searchLang] || langMap.english;

      const systemPrompt = `You are an educational AI. Explain the topic "${query}" in detail.
${styleInstruction}
${langInstruction}
Write in a simple, easy-to-understand way. Use short sentences and clear examples.
For important terms and headings, use **bold** like this (**important term**). Do NOT use # or * symbols for formatting.
Structure your answer with clear sections. Each section heading should be wrapped in ** ** like **What is it?**.
After the explanation, list 4-6 key points each on a new line starting with "KEY:".
Then list 3-4 related topics each on a new line starting with "RELATED:".`;

      const res = await api.aiChat([
        { role: "system", content: systemPrompt },
        { role: "user", content: `Explain ${query} in detail with key points.` }
      ]);

      const reply: string = res?.data?.content || "";

      if (!reply) throw new Error("Empty response");

      const points: string[] = [];
      const related: string[] = [];
      let summary = reply;

      const keyMatch = reply.match(/^KEY:.*$/gm);
      if (keyMatch) {
        points.push(...keyMatch.map(k => k.replace(/^KEY:\s*/i, '')));
        summary = summary.replace(/^KEY:.*$/gm, '').trim();
      }

      const relatedMatch = reply.match(/^RELATED:.*$/gm);
      if (relatedMatch) {
        related.push(...relatedMatch.map(r => r.replace(/^RELATED:\s*/i, '')));
        summary = summary.replace(/^RELATED:.*$/gm, '').trim();
      }

      const fallbackPoints = [
        `${query} is a fundamental concept with broad applications`,
        `Understanding its core principles enables better problem-solving`,
        `Practice and application reinforce theoretical knowledge`,
        `Modern advancements continue to expand its capabilities`,
      ];

      const fallbackRelated = [
        `Advanced ${query}`,
        `Practical Applications of ${query}`,
        `${query} Best Practices`,
      ];

      const diagram = generateDiagram(query);

      let imageUrl = "";
      try {
        const imgRes = await api.aiGenerateImage(`Simple clean illustration representing ${query.slice(0, 100)}, minimal vector art, solid colors, clear shapes, professional, white background`, "digital-art");
        imageUrl = imgRes?.data?.url || "";
      } catch {
        const fallbackPrompt = `Simple clean illustration representing ${query.slice(0, 80)}, minimal vector art, solid colors, clear shapes, professional, white background, no text`;
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fallbackPrompt)}?width=800&height=450&nologo=true`;
      }

      setAiResult({
        id: "ai-" + Date.now(),
        title: `AI Search: ${query.length > 50 ? query.slice(0, 50) + "..." : query}`,
        summary: summary.slice(0, 1200),
        diagram,
        imageUrl,
        keyPoints: points.length >= 2 ? points : fallbackPoints,
        relatedTopics: related.length >= 2 ? related : fallbackRelated,
        sourceIcon: <Brain className="w-4 h-4" />,
      });
    } catch {
      const fallbackResult = deepSearchResults[resultKey] || deepSearchResults.default;
      const diagram = generateDiagram(query);
      let imageUrl = "";
      try {
        const imgRes = await api.aiGenerateImage(`Simple clean illustration representing ${query.slice(0, 100)}, minimal vector art, solid colors, clear shapes, professional, white background`, "digital-art");
        imageUrl = imgRes?.data?.url || "";
      } catch {
        const fbPrompt = `Simple clean illustration representing ${query.slice(0, 80)}, minimal vector art, solid colors, clear shapes, professional, white background, no text`;
        imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fbPrompt)}?width=800&height=450&nologo=true`;
      }
      setAiResult({
        ...fallbackResult,
        title: `AI Search: ${query.length > 50 ? query.slice(0, 50) + "..." : query}`,
        diagram,
        imageUrl,
      });
    }

    setIsSearching(false);
    setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Search"
        subtitle="Ask any question â€” AI explains with diagrams, key points and generated images."
        icon={Brain}
      />

      <LearningNav />

        <div className="max-w-4xl mx-auto space-y-6">
          <GlassCard hover={false}>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">AI Search</h2>
                  <p className="text-xs text-muted-foreground">
                    Ask any question — AI explains with diagrams & generated images
                  </p>
                </div>
              </div>
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleDeepSearch(searchQuery, searchMethod);
                    }
                  }}
                  placeholder="Ask anything... e.g., How do neural networks work?"
                  rows={2}
                  className="w-full rounded-xl bg-muted border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => handleDeepSearch(searchQuery || "How do neural networks work?", searchMethod)}
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {isSearching ? "Searching..." : "AI Search"}
                </Button>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Explanation Style:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["auto", "simple", "sorting", "quantum", "transformers"] as SearchMethod[]).map((m) => (
                    <button
                      key={m}
                      onClick={() => setSearchMethod(m)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        searchMethod === m
                          ? "bg-[#1E3A5F] text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {m === "auto" ? "Auto" : m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Language:</p>
                <div className="flex flex-wrap gap-1.5">
                  {(["urdu", "punjabi", "roman-urdu", "hindi", "english"] as SearchLang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setSearchLang(l)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        searchLang === l
                          ? "bg-[#1E3A5F] text-white shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                      }`}
                    >
                      {l === "roman-urdu" ? "Roman Urdu" : l.charAt(0).toUpperCase() + l.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

          {isSearching && (
            <GlassCard hover={false}>
              <div className="flex items-center gap-4 py-6">
                <div className="relative">
                  <Brain className="w-10 h-10 text-primary animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent animate-ping" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">AI is searching...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Analyzing knowledge · Generating diagrams · Creating images
                  </p>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-primary rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            </GlassCard>
          )}

          {aiResult && !isSearching && (
            <div ref={resultsRef} className="space-y-4">
              <GlassCard hover={false}>
              <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                    <Search className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-foreground">{aiResult.title}</h2>
                    <p className="text-xs text-muted-foreground">AI Search Result</p>
                  </div>
                </div>
                <div
                  className="text-sm text-muted-foreground leading-relaxed mb-6"
                  dangerouslySetInnerHTML={{
                    __html: aiResult.summary
                      .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1E3A5F">$1</strong>')
                      .replace(/\n/g, '<br />')
                  }}
                />
              </GlassCard>

              {aiResult.imageUrl && (
                <GlassCard hover={false}>
                  <div className="flex items-center gap-2 mb-4">
                    <ImageIcon className="w-5 h-5 text-purple-500" />
                    <h3 className="text-[#1E3A5F] font-bold text-sm">Generated Visual</h3>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-100 p-3 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={aiResult.imageUrl}
                      alt="AI Generated visual"
                      className="rounded-lg max-w-full h-auto"
                      style={{ maxHeight: 400 }}
                    />
                  </div>
                </GlassCard>
              )}

              {aiResult.diagram && (
                <GlassCard hover={false}>
                  <div className="flex items-center gap-2 mb-4">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    <h3 className="text-[#1E3A5F] font-bold text-sm">Visual Diagram</h3>
                  </div>
                  <div className="rounded-xl overflow-hidden bg-white dark:bg-gray-50 p-4 flex justify-center w-full">
                    <div className="w-full max-w-[700px]" dangerouslySetInnerHTML={{ __html: aiResult.diagram }} />
                  </div>
                </GlassCard>
              )}

              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h3 className="text-[#1E3A5F] font-bold text-sm">Key Points</h3>
                </div>
                <div className="space-y-2">
                  {aiResult.keyPoints.map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{
                        __html: point.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1E3A5F">$1</strong>')
                      }} />
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard hover={false}>
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-primary" />
                  <h3 className="text-[#1E3A5F] font-bold text-sm">Related Topics</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiResult.relatedTopics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleDeepSearch(`Explain ${topic}`, searchMethod)}
                      className="px-3 py-1.5 rounded-lg bg-muted text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-all"
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                Was this helpful?
                <button
                  onClick={() => setFeedback(feedback === "yes" ? null : "yes")}
                  className={cn(
                    "transition-all",
                    feedback === "yes" ? "text-green-500 font-semibold" : "hover:text-foreground"
                  )}
                >
                  {feedback === "yes" ? "✓ Thanks!" : "Yes"}
                </button>
                <span>·</span>
                <button
                  onClick={() => setFeedback(feedback === "no" ? null : "no")}
                  className={cn(
                    "transition-all",
                    feedback === "no" ? "text-red-500 font-semibold" : "hover:text-foreground"
                  )}
                >
                  {feedback === "no" ? "✕ Noted" : "No"}
                </button>
                <span>·</span>
                <button
                  onClick={() => {
                    inputRef.current?.focus();
                    inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    setSearchQuery(aiResult.title.replace(/^AI Search:\s*/, "").replace(/\.\.\.$/, ""));
                  }}
                  className="hover:text-foreground transition-all"
                >
                  Ask Follow-up
                </button>
              </div>
            </div>
          )}

          {!aiResult && !isSearching && (
            <div className="text-center py-16 glass rounded-2xl">
              <div className="w-16 h-16 rounded-2xl bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">AI Search</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Ask a question to get explanations with diagrams, key points, related topics, and AI-generated images.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><BarChart3 className="w-3.5 h-3.5 text-primary" /> Diagrams</span>
                <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5 text-purple-500" /> Images</span>
                <span className="flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5 text-amber-500" /> Key Points</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-primary" /> Related Topics</span>
              </div>
            </div>
          )}
        </div>
    </div>
  );
}