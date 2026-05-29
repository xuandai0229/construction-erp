import React from "react";

interface PrintLayoutProps {
  children: React.ReactNode;
}

export function PrintLayout({ children }: PrintLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-black p-8 font-serif print:p-0 print:m-0 print:bg-white print:text-black">
      {/* Dynamic inline style to override ERP layouts in printing */}
      <style jsx global>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
            font-size: 12px !important;
          }
          /* Hide standard ERP UI wrappers */
          .erp-page-main, main, nav, aside, header, footer, button, .print\\:hidden {
            display: none !important;
            width: 0 !important;
            height: 0 !important;
            overflow: hidden !important;
          }
          /* Ensure printable area takes full screen */
          .print-container {
            display: block !important;
            width: 100% !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            margin: 0 !important;
            padding: 20px !important;
          }
        }
      `}</style>
      <div className="print-container max-w-4xl mx-auto space-y-8">
        {children}
      </div>
    </div>
  );
}
