"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Printer, Copy } from "lucide-react";

interface ZoneQRDisplayProps {
  zoneId: string;
  zoneName: string;
  requiredPpe: string[];
  hazardTypes: string[];
}

export default function ZoneQRDisplay({ zoneId, zoneName, requiredPpe, hazardTypes }: ZoneQRDisplayProps) {
  
  function handleDownload() {
    const svg = document.getElementById(`qr-${zoneId}`) as SVGElement;
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${zoneName}-qr-code.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  }

  function handleCopy() {
    navigator.clipboard.writeText(zoneId);
    alert("Zone ID copied to clipboard!");
  }

  function handlePrint() {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${zoneName} - QR Code</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              padding: 20px;
            }
            .qr-container { 
              text-align: center; 
              border: 2px solid #000; 
              padding: 20px; 
              margin: 20px;
            }
            .zone-info { 
              margin-bottom: 20px; 
            }
            .ppe-list { 
              margin-top: 10px; 
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="zone-info">
              <h1>${zoneName}</h1>
              <p><strong>Zone ID:</strong> ${zoneId}</p>
              ${requiredPpe.length > 0 ? `
                <div class="ppe-list">
                  <strong>Required PPE:</strong><br>
                  ${requiredPpe.map(ppe => `• ${ppe.replace(/_/g, ' ')}`).join('<br>')}
                </div>
              ` : ''}
            </div>
            ${document.getElementById(`qr-${zoneId}`)?.outerHTML || ''}
            <p style="margin-top: 15px; font-size: 12px;">
              Workers: Scan this QR code with the ChemSafe app to check into this zone
            </p>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.print();
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">{zoneName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-center p-6 bg-white rounded-lg">
          <QRCodeSVG 
            id={`qr-${zoneId}`}
            value={zoneId} 
            size={200}
            level="M"
            includeMargin={true}
            style={{ maxWidth: "100%", height: "auto" }}
          />
        </div>
        
        <div className="text-center space-y-2">
          <p className="text-sm font-display font-semibold">Zone ID: {zoneId}</p>
          
          {requiredPpe.length > 0 && (
            <div className="text-xs text-steel">
              <p className="font-semibold mb-1">Required PPE:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {requiredPpe.map(ppe => (
                  <span key={ppe} className="px-2 py-1 bg-hazard/10 rounded text-hazard">
                    {ppe.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {hazardTypes.length > 0 && (
            <div className="text-xs text-steel">
              <p className="font-semibold mb-1">Detected Hazards:</p>
              <div className="flex flex-wrap gap-1 justify-center">
                {hazardTypes.map(hazard => (
                  <span key={hazard} className="px-2 py-1 bg-corrosive/10 rounded text-corrosive">
                    {hazard.replace("GHS_Symbol_", "")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button onClick={handleDownload} variant="outline" size="sm">
            <Download size={14} />
            Download
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer size={14} />
            Print
          </Button>
          <Button onClick={handleCopy} variant="outline" size="sm">
            <Copy size={14} />
            Copy ID
          </Button>
        </div>

        <div className="text-xs text-steel text-center p-3 bg-ink/50 rounded">
          <p className="font-semibold mb-1">Instructions:</p>
          <p>Print and post this QR code at the work location. Workers scan it with the ChemSafe app to check in and start PPE monitoring.</p>
        </div>
      </CardContent>
    </Card>
  );
}