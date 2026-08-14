"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ArrowLeft, MapPin, Shield, AlertTriangle, Loader2 } from "lucide-react";
import type { Detection } from "@/lib/onnx/inference";

interface ZoneConfirmationDialogProps {
  zoneName: string;
  detections: Detection[];
  selectedPPE: string[];
  additionalRequirements: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  onEdit: () => void;
  isCreating: boolean;
}

export default function ZoneConfirmationDialog({
  zoneName,
  detections,
  selectedPPE,
  additionalRequirements,
  onConfirm,
  onCancel,
  onEdit,
  isCreating
}: ZoneConfirmationDialogProps) {
  
  const [previewQR, setPreviewQR] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin size={20} />
            Confirm Zone Creation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone Overview */}
          <div className="p-4 bg-hazard/10 border border-hazard/20 rounded-lg">
            <h3 className="font-display font-bold text-lg mb-2">{zoneName}</h3>
            <p className="text-sm text-steel">
              Please review all zone details before creating. This information will be provided to workers during check-in.
            </p>
          </div>

          {/* Detected Hazards */}
          {detections.length > 0 && (
            <div>
              <h3 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
                <AlertTriangle size={16} className="text-corrosive" />
                Detected Chemical Hazards
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {detections.map((detection, i) => (
                  <div key={i} className="p-2 bg-corrosive/10 border border-corrosive/20 rounded text-center">
                    <p className="text-xs font-medium text-corrosive">
                      {detection.class.replace("GHS_Symbol_", "Symbol ")}
                    </p>
                    <p className="text-xs text-steel">
                      {Math.round(detection.confidence * 100)}% confidence
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Required PPE */}
          <div>
            <h3 className="font-display font-semibold text-base mb-3 flex items-center gap-2">
              <Shield size={16} className="text-hazard" />
              Required Personal Protective Equipment
            </h3>
            {selectedPPE.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {selectedPPE.map((ppe, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-hazard/10 rounded-lg">
                    <span className="text-xs">🛡️</span>
                    <span className="text-sm font-medium capitalize">
                      {ppe.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel text-sm italic">No specific PPE requirements</p>
            )}
          </div>

          {/* Additional Requirements */}
          {additionalRequirements && (
            <div>
              <h3 className="font-display font-semibold text-base mb-3">Additional Safety Requirements</h3>
              <div className="p-3 bg-ink/50 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{additionalRequirements}</p>
              </div>
            </div>
          )}

          {/* What Happens Next */}
          <div className="border-t border-white/10 pt-4">
            <h3 className="font-display font-semibold text-base mb-3">What happens after creation:</h3>
            <div className="space-y-2 text-sm text-steel">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-safe mt-0.5 flex-shrink-0" />
                <p>Zone will be created and available immediately</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-safe mt-0.5 flex-shrink-0" />
                <p>QR code will be generated for worker check-ins</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-safe mt-0.5 flex-shrink-0" />
                <p>Workers will see safety briefing when they scan the QR code</p>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={16} className="text-safe mt-0.5 flex-shrink-0" />
                <p>You can monitor worker compliance from the admin dashboard</p>
              </div>
            </div>
          </div>

          {/* QR Code Preview */}
          {previewQR && (
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-display font-semibold text-base mb-3">QR Code Preview</h3>
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <QRCodeSVG 
                  value={`PREVIEW-${zoneName}`}
                  size={150}
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-steel text-center mt-2">
                Actual QR code will be generated after zone creation
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/10">
            <Button 
              onClick={onCancel}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft size={16} />
              Cancel
            </Button>
            
            <Button 
              onClick={onEdit}
              variant="outline"
              className="flex-1"
            >
              Edit Details
            </Button>
            
            {!previewQR && (
              <Button 
                onClick={() => setPreviewQR(true)}
                variant="outline"
                className="flex-1"
              >
                Preview QR
              </Button>
            )}
            
            <Button 
              onClick={onConfirm}
              disabled={isCreating}
              className="flex-1 bg-safe hover:bg-safe/90"
            >
              {isCreating ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Creating Zone...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Create Zone
                </>
              )}
            </Button>
          </div>

          {/* Important Notice */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
            <p className="text-xs text-blue-500">
              <strong>Important:</strong> Once created, zone settings can be modified but workers already checked-in 
              will need to acknowledge any new requirements. Ensure all details are correct before proceeding.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}