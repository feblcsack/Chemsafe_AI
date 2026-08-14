"use client";

import { useState } from "react";
import GHSScanner from "@/components/GHSScanner";
import HazardResultCard from "@/components/HazardResultCard";
import ZoneConfirmationDialog from "@/components/ZoneConfirmationDialog";
import { createClient } from "@/lib/supabase/client";
import { resolveCurrentUserContext } from "@/lib/supabase/userContext";
import type { Detection } from "@/lib/onnx/inference";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Shield, ScanSearch } from "lucide-react";

interface HazardInfo {
  class: string;
  label: string;
  plain_meaning: string;
  safety_tips: string[];
}

interface Zone {
  id: string;
  name: string;
  hazard_types: string[];
  required_ppe: string[];
}

export default function AdminGHSScanner() {
  const [scanning, setScanning] = useState(false);
  const [detections, setDetections] = useState<Detection[] | null>(null);
  const [hazards, setHazards] = useState<HazardInfo[]>([]);
  const [ocrText, setOcrText] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(0);
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState<Zone[]>([]);
  const [recommendedPPE, setRecommendedPPE] = useState<string[]>([]);
  const [creatingZone, setCreatingZone] = useState(false);
  const [zoneName, setZoneName] = useState("");
  const [selectedPPE, setSelectedPPE] = useState<string[]>([]);
  const [additionalRequirements, setAdditionalRequirements] = useState<string>("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const PPE_OPTIONS = [
    "helmet", "safety_goggles", "gloves", "safety_boots", 
    "high_vis_vest", "respirator", "face_shield", "ear_protection"
  ];

  async function handleScanResult(dets: Detection[], text: string, conf: number) {
    console.log("Scan result received:", { dets, text, conf });
    
    setDetections(dets);
    setOcrText(text);
    setOcrConfidence(conf);
    setLoading(true);
    setScanning(false); // Stop scanning immediately

    try {
      // Check if we have any detections
      if (!dets || dets.length === 0) {
        console.warn("No GHS symbols detected in scan");
        alert("No GHS symbols detected. Please try scanning a chemical product label with hazard pictograms.");
        setLoading(false);
        return;
      }

      console.log("Processing detections:", dets.map(d => d.class));

      // Get hazard info from backend
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pubchem/lookup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          ghs_classes: dets.map((d) => d.class), 
          product_name_text: text || null 
        }),
      });
      
      let hazardData = null;
      if (res.ok) {
        hazardData = await res.json();
        console.log("Hazard data received:", hazardData);
        setHazards(hazardData.hazards || []);
        
        // Generate PPE recommendations based on hazards
        const ppeRecommendations = generatePPERecommendations(dets.map(d => d.class), hazardData.hazards || []);
        console.log("PPE recommendations generated:", ppeRecommendations);
        setRecommendedPPE(ppeRecommendations);
        setSelectedPPE(ppeRecommendations);
      } else {
        console.warn("Failed to fetch hazard data:", res.status, res.statusText);
        // Still generate recommendations based on GHS classes only
        const ppeRecommendations = generatePPERecommendations(dets.map(d => d.class), []);
        console.log("Fallback PPE recommendations:", ppeRecommendations);
        setRecommendedPPE(ppeRecommendations);
        setSelectedPPE(ppeRecommendations);
      }

      // Load existing zones for reference
      const context = await resolveCurrentUserContext();
      if (context.orgId) {
        try {
          const zonesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones/org/${context.orgId}`);
          if (zonesRes.ok) {
            const zonesData = await zonesRes.json();
            setZones(zonesData);
          } else {
            console.warn("Failed to load zones:", zonesRes.status);
          }
        } catch (error) {
          console.error("Error loading zones:", error);
        }
      }

      // Log workplace scan (only if we have user context)
      if (context.user?.id) {
        try {
          const supabase = createClient();
          await supabase.from("workplace_scans").insert({
            zone_id: null, // Will be set when zone is created
            scanned_by: context.user.id,
            hazard_detected: dets.map((d) => d.class),
            pubchem_data: hazardData,
          });
          console.log("Workplace scan logged successfully");
        } catch (error) {
          console.error("Failed to log workplace scan:", error);
          // Don't block the flow for logging errors
        }
      }

    } catch (error) {
      console.error("Failed to process scan:", error);
      // Fallback: still generate basic PPE recommendations
      const ppeRecommendations = generatePPERecommendations(dets.map(d => d.class), []);
      console.log("Error fallback PPE recommendations:", ppeRecommendations);
      setRecommendedPPE(ppeRecommendations);
      setSelectedPPE(ppeRecommendations);
      
      alert("Warning: Could not fetch detailed hazard information, but basic PPE recommendations have been generated based on detected symbols.");
    } finally {
      setLoading(false);
    }
  }

  function generatePPERecommendations(ghsClasses: string[], hazardInfo: HazardInfo[]): string[] {
    const recommendations = new Set<string>();
    
    // Base recommendations from GHS classes
    ghsClasses.forEach(cls => {
      switch (cls) {
        case "GHS_Symbol_01": // Explosive
        case "GHS_Symbol_02": // Flammable
          recommendations.add("safety_goggles");
          recommendations.add("gloves");
          recommendations.add("safety_boots");
          break;
        case "GHS_Symbol_03": // Oxidizing
        case "GHS_Symbol_05": // Corrosive
        case "GHS_Symbol_08": // Health hazard
          recommendations.add("safety_goggles");
          recommendations.add("gloves");
          recommendations.add("respirator");
          break;
        case "GHS_Symbol_04": // Compressed gas
          recommendations.add("safety_goggles");
          recommendations.add("gloves");
          break;
        case "GHS_Symbol_06": // Toxic
        case "GHS_Symbol_09": // Environmental hazard
          recommendations.add("respirator");
          recommendations.add("gloves");
          recommendations.add("safety_goggles");
          break;
        case "GHS_Symbol_07": // Harmful/irritant
          recommendations.add("gloves");
          recommendations.add("safety_goggles");
          break;
      }
    });

    // Add helmet for all chemical work areas
    if (recommendations.size > 0) {
      recommendations.add("helmet");
    }

    return Array.from(recommendations);
  }

  async function createNewZone() {
    if (!zoneName.trim() || selectedPPE.length === 0) return;
    
    setCreatingZone(true);
    try {
      const context = await resolveCurrentUserContext();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: context.orgId,
          name: zoneName,
          hazard_types: detections?.map(d => d.class) || [],
          required_ppe: selectedPPE,
          additional_requirements: additionalRequirements.trim() || null,
          created_by: context.user?.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setZones(prev => [...prev, data.zone]);
        
        // Reset form
        setZoneName("");
        setSelectedPPE([]);
        setAdditionalRequirements("");
        setShowConfirmation(false);
        setDetections(null);
        setHazards([]);
        setRecommendedPPE([]);
        
        alert(`Zone "${zoneName}" created successfully!\n\nQR Code ID: ${data.qr_payload}\n\nYou can now print the QR code from the QR Codes tab.`);
      }
    } catch (error) {
      console.error("Failed to create zone:", error);
    } finally {
      setCreatingZone(false);
    }
  }

  function handleCreateZone() {
    if (!zoneName.trim()) {
      alert("Please enter a zone name");
      return;
    }
    if (selectedPPE.length === 0) {
      alert("Please select at least one PPE requirement");
      return;
    }
    setShowConfirmation(true);
  }

  if (!scanning && !detections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ScanSearch size={20} />
            Workplace Assessment Scanner
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-steel text-sm mb-4">
            Scan GHS pictograms on chemical products to assess workplace hazards and generate PPE requirements for new zones.
          </p>
          <Button onClick={() => setScanning(true)} className="w-full">
            <ScanSearch size={16} />
            Start Workplace Assessment
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (scanning && !detections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Scanning Chemical Product</CardTitle>
        </CardHeader>
        <CardContent>
          <GHSScanner onResult={handleScanResult} />
          <div className="space-y-2 mt-4">
            <Button 
              onClick={() => {
                setScanning(false);
                setLoading(false);
              }} 
              variant="outline" 
              className="w-full"
            >
              Cancel Scan
            </Button>
            <p className="text-xs text-steel text-center">
              Point camera at GHS pictograms on chemical product labels
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield size={20} />
            Assessment Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => {
              setScanning(false);
              setDetections(null);
              setHazards([]);
              setRecommendedPPE([]);
            }} 
            variant="outline" 
            size="sm" 
            className="mb-4"
          >
            Scan Another Product
          </Button>

          {loading ? (
            <div className="flex items-center gap-2 text-steel">
              <Loader2 className="animate-spin" size={16} />
              Analyzing hazards and generating PPE recommendations...
            </div>
          ) : (
            <>
              <HazardResultCard
                detections={detections || []}
                hazards={hazards}
                ocrText={ocrText}
                ocrConfidence={ocrConfidence}
                onSearchByName={() => {}}
              />

              {recommendedPPE.length > 0 && (
                <div className="mt-6 p-4 bg-safe/10 border-2 border-safe/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Shield size={20} className="text-safe" />
                    <h3 className="font-display font-bold text-safe">
                      ✅ PPE Requirements Generated Successfully!
                    </h3>
                  </div>
                  
                  <div className="bg-white/5 p-3 rounded mb-4">
                    <p className="text-sm font-medium mb-2">
                      Based on the detected hazards, here are the recommended safety requirements:
                    </p>
                    <div className="text-xs text-steel">
                      Detected: {detections?.map(d => d.class.replace("GHS_Symbol_", "Symbol ")).join(", ")}
                    </div>
                  </div>

                  <h4 className="font-display font-semibold mb-3 text-hazard">
                    Select Required PPE (Click to customize):
                  </h4>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {PPE_OPTIONS.map(ppe => (
                      <label key={ppe} className={`flex items-center gap-2 cursor-pointer p-2 rounded transition-colors ${
                        selectedPPE.includes(ppe) 
                          ? "bg-safe/20 border border-safe/40" 
                          : "bg-white/5 border border-white/10"
                      }`}>
                        <input
                          type="checkbox"
                          checked={selectedPPE.includes(ppe)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPPE(prev => [...prev, ppe]);
                            } else {
                              setSelectedPPE(prev => prev.filter(p => p !== ppe));
                            }
                          }}
                          className="rounded text-safe"
                        />
                        <span className="text-sm font-medium capitalize">
                          {ppe.replace(/_/g, ' ')}
                        </span>
                        {recommendedPPE.includes(ppe) && (
                          <span className="text-xs text-safe">✨ AI Recommended</span>
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="border-t border-safe/20 pt-4">
                    <h4 className="font-display font-semibold mb-3 flex items-center gap-2">
                      <Settings size={16} />
                      Additional Safety Requirements (Optional)
                    </h4>
                    <textarea
                      value={additionalRequirements}
                      onChange={(e) => setAdditionalRequirements(e.target.value)}
                      placeholder="Add any additional safety requirements, procedures, or notes for this zone..."
                      className="w-full p-3 rounded border border-white/20 bg-white/5 text-sm min-h-20 resize-vertical"
                      rows={3}
                    />
                    <p className="text-xs text-steel mt-1">
                      Examples: "Training certification required", "Buddy system mandatory", "Emergency shower location: East wall"
                    </p>
                  </div>

                  <div className="border-t border-safe/20 pt-4">
                    <h4 className="font-display font-semibold mb-2 text-hazard">
                      🏭 Create New Work Zone
                    </h4>
                    <p className="text-sm text-steel mb-3">
                      Ready to create a monitored work zone with these PPE requirements?
                    </p>
                    <input
                      type="text"
                      placeholder="Enter zone name (e.g., Chemical Storage Area)"
                      value={zoneName}
                      onChange={(e) => setZoneName(e.target.value)}
                      className="w-full p-3 rounded border border-hazard/30 bg-white/5 mb-3 font-medium"
                    />
                    <Button 
                      onClick={handleCreateZone}
                      disabled={!zoneName.trim() || selectedPPE.length === 0}
                      className="w-full bg-safe hover:bg-safe/80 text-black font-bold"
                      size="lg"
                    >
                      🚀 Create Zone & Generate QR Code
                    </Button>
                    <p className="text-xs text-steel mt-2 text-center">
                      This will create the zone and generate a QR code for workers to scan
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {zones.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Zones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {zones.map(zone => (
                <div key={zone.id} className="p-3 border border-white/10 rounded-lg">
                  <p className="font-display font-semibold">{zone.name}</p>
                  <p className="text-sm text-steel">
                    PPE Required: {zone.required_ppe.join(", ") || "None"}
                  </p>
                  <p className="text-xs text-steel">
                    Hazards: {zone.hazard_types.map(h => h.replace("GHS_Symbol_", "")).join(", ")}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Zone Confirmation Dialog */}
      {showConfirmation && detections && (
        <ZoneConfirmationDialog
          zoneName={zoneName}
          detections={detections}
          selectedPPE={selectedPPE}
          additionalRequirements={additionalRequirements}
          onConfirm={createNewZone}
          onCancel={() => setShowConfirmation(false)}
          onEdit={() => setShowConfirmation(false)}
          isCreating={creatingZone}
        />
      )}
    </div>
  );
}