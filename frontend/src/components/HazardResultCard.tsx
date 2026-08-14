"use client";

import { useState } from "react";
import type { Detection } from "@/lib/onnx/inference";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";

interface HazardInfo {
  class: string;
  label: string;
  plain_meaning: string;
  safety_tips: string[];
}

interface Props {
  detections: Detection[];
  hazards: HazardInfo[];
  ocrText: string;
  ocrConfidence: number;
  onSearchByName: (correctedText: string) => void;
}

export default function HazardResultCard({
  detections,
  hazards,
  ocrText,
  ocrConfidence,
  onSearchByName,
}: Props) {
  const [editedText, setEditedText] = useState(ocrText);
  const lowConfidence = ocrConfidence < 60;

  if (detections.length === 0) {
    return (
      <Card className="max-w-md mx-auto mt-6">
        <CardContent className="pt-5 flex gap-3">
          <AlertTriangle className="text-steel shrink-0" size={18} />
          <div>
            <p className="font-display font-bold">No GHS symbols detected</p>
            <p className="text-sm text-steel mt-1">
              Try getting closer to the label and make sure there's enough light.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-6 space-y-4">
      {hazards.map((h) => (
        <Card key={h.class} className="border-l-2 border-l-corrosive">
          <CardContent className="pt-5">
            <p className="font-display font-bold">{h.label}</p>
            <p className="text-sm text-steel mt-1">{h.plain_meaning}</p>
            <ul className="mt-3 space-y-1.5">
              {h.safety_tips.map((tip, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <ChevronRight className="text-hazard shrink-0 mt-0.5" size={14} />
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}

      {ocrText && (
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-steel uppercase font-display tracking-wide">
              Text read from label {lowConfidence && "— low confidence, please check"}
            </p>
            <Textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="mt-2"
              rows={2}
            />
            <Button
              variant="link"
              size="sm"
              onClick={() => onSearchByName(editedText)}
              className="mt-2 px-0"
            >
              <Search size={13} /> Look up this product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
