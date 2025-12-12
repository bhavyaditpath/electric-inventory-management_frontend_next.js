import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { PurchaseResponseDto } from "../types/api-types";

export const exportPurchasesToPDF = (
  purchases: PurchaseResponseDto[],
  branchName: string
) => {
  const doc = new jsPDF();

  // OPTIONAL — Your logo (replace with real Base64 or URL)
  const logoBase64 = ""; // <-- Add your base64 here if needed

  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 30, "F");

  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text("Branch Purchase Report", 14, 18);

  doc.setFontSize(11);
  doc.text(
    `Generated on: ${new Date().toLocaleDateString()} | Branch: ${branchName}`,
    14,
    26
  );

  // Optional: Add logo
  if (logoBase64) {
    doc.addImage(logoBase64, "PNG", pageWidth - 40, 5, 30, 20);
  }

  // Reset text color for body
  doc.setTextColor(0, 0, 0);

  let y = 40;

  const cardWidth = (pageWidth - 28) / 2;
  const cardHeight = 22;

  const summary = [
    { label: "Total Purchases", value: purchases.length },
    {
      label: "Total Amount",
      value:
        "Rs " +
        purchases
          .reduce((sum, p) => sum + Number(p.totalPrice), 0)
          .toFixed(2),
    },
    {
      label: "Total Items",
      value:
        purchases
          .reduce((sum, p) => sum + Number(p.quantity), 0)
          .toFixed(2) + " units",
    },
    {
      label: "Unique Products",
      value: new Set(purchases.map((p) => p.productName)).size,
    },
  ];

  doc.setFontSize(13);
  doc.text("Summary", 14, y);
  y += 6;

  summary.forEach((item, i) => {
    const x = 14 + (i % 2) * (cardWidth + 4);
    const cardY = y + Math.floor(i / 2) * (cardHeight + 5);

    // Card background
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 3, 3, "F");

    // Text
    doc.setFontSize(11);
    doc.setTextColor(70, 70, 70);
    doc.text(item.label, x + 4, cardY + 8);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(String(item.value), x + 4, cardY + 16);
  });

  y += cardHeight * 2 + 14;

  const tableData = purchases.map((p) => [
    p.productName,
    p.brand,
    `${p.quantity} ${p.unit}`,
    `Rs ${p.pricePerUnit}`,
    `Rs ${p.totalPrice}`,
    new Date(p.createdAt).toLocaleDateString(),
    p.lowStockThreshold.toString(),
  ]);

  autoTable(doc, {
    startY: y,
    head: [
      [
        "Product Name",
        "Supplier",
        "Quantity",
        "Price/Unit",
        "Total Price",
        "Date",
        "Threshold",
      ],
    ],
    body: tableData,
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [200, 200, 200],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(9);
    doc.setTextColor(120);

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }

  doc.save(`Purchase_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
};
