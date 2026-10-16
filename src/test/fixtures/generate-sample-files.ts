import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

export async function createSamplePdfs(targetDir: string) {
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  // 1. Google Pay Sample PDF (Format A)
  const gpayDoc = await PDFDocument.create();
  const gpayPage = gpayDoc.addPage([595, 842]); // A4
  const font = await gpayDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await gpayDoc.embedFont(StandardFonts.HelveticaBold);

  let y = 780;
  gpayPage.drawText("Google Pay", { x: 50, y, font: fontBold, size: 20, color: rgb(0.1, 0.4, 0.8) });
  y -= 30;
  gpayPage.drawText("Transaction Receipt", { x: 50, y, font, size: 12, color: rgb(0.4, 0.4, 0.4) });
  y -= 40;
  gpayPage.drawText("Paid to Manjeet", { x: 50, y, font: fontBold, size: 16 });
  y -= 25;
  gpayPage.drawText("Amount: INR 564.00", { x: 50, y, font: fontBold, size: 14, color: rgb(0.1, 0.6, 0.3) });
  y -= 25;
  gpayPage.drawText("Date: 24 Aug, 2026", { x: 50, y, font, size: 12 });
  y -= 20;
  gpayPage.drawText("UPI Transaction ID: 623660426874", { x: 50, y, font, size: 11, color: rgb(0.3, 0.3, 0.3) });
  y -= 20;
  gpayPage.drawText("Payment source: Kotak Mahindra Bank 0667", { x: 50, y, font, size: 11, color: rgb(0.3, 0.3, 0.3) });
  y -= 50;
  // Second transaction in same doc to test multiple transactions
  gpayPage.drawText("Paid to NETFLIX INDIA", { x: 50, y, font: fontBold, size: 16 });
  y -= 25;
  gpayPage.drawText("Amount: INR 499.00", { x: 50, y, font: fontBold, size: 14, color: rgb(0.1, 0.6, 0.3) });
  y -= 25;
  gpayPage.drawText("Date: 25 Aug, 2026", { x: 50, y, font, size: 12 });
  y -= 20;
  gpayPage.drawText("UPI Transaction ID: 623660426875", { x: 50, y, font, size: 11, color: rgb(0.3, 0.3, 0.3) });

  const gpayBytes = await gpayDoc.save();
  fs.writeFileSync(path.join(targetDir, "gpay-sample.pdf"), gpayBytes);

  // 2. PhonePe Sample PDF (Format B)
  const phonepeDoc = await PDFDocument.create();
  const phonepePage = phonepeDoc.addPage([595, 842]);

  y = 780;
  phonepePage.drawText("PhonePe Transaction Statement", { x: 50, y, font: fontBold, size: 20, color: rgb(0.4, 0.2, 0.7) });
  y -= 40;
  phonepePage.drawText("Paid to SAITM", { x: 50, y, font: fontBold, size: 16 });
  y -= 25;
  phonepePage.drawText("Type: DEBIT", { x: 50, y, font, size: 12, color: rgb(0.8, 0.1, 0.1) });
  y -= 20;
  phonepePage.drawText("Amount: INR 60,500.00", { x: 50, y, font: fontBold, size: 14 });
  y -= 25;
  phonepePage.drawText("Date: Aug 29, 2026", { x: 50, y, font, size: 12 });
  y -= 20;
  phonepePage.drawText("Transaction ID: T2608291609522447721902", { x: 50, y, font, size: 11 });
  y -= 20;
  phonepePage.drawText("UTR: 479923133777", { x: 50, y, font, size: 11 });
  y -= 20;
  phonepePage.drawText("Payment source: masked account ending in 6637", { x: 50, y, font, size: 11, color: rgb(0.4, 0.4, 0.4) });
  y -= 50;
  // Second transaction: Spotify
  phonepePage.drawText("Paid to Spotify India", { x: 50, y, font: fontBold, size: 16 });
  y -= 25;
  phonepePage.drawText("Type: DEBIT", { x: 50, y, font, size: 12, color: rgb(0.8, 0.1, 0.1) });
  y -= 20;
  phonepePage.drawText("Amount: INR 119.00", { x: 50, y, font: fontBold, size: 14 });
  y -= 25;
  phonepePage.drawText("Date: Aug 30, 2026", { x: 50, y, font, size: 12 });
  y -= 20;
  phonepePage.drawText("Transaction ID: T2608301122334455667788", { x: 50, y, font, size: 11 });
  y -= 20;
  phonepePage.drawText("UTR: 479923133888", { x: 50, y, font, size: 11 });

  const phonepeBytes = await phonepeDoc.save();
  fs.writeFileSync(path.join(targetDir, "phonepe-sample.pdf"), phonepeBytes);

  // 3. Bank Statement Sample PDF (Format C)
  const bankDoc = await PDFDocument.create();
  const bankPage = bankDoc.addPage([595, 842]);

  y = 780;
  bankPage.drawText("Statement of Account", { x: 50, y, font: fontBold, size: 20 });
  y -= 25;
  bankPage.drawText("Account Number: XXXXXXXX4589 | Currency: INR", { x: 50, y, font, size: 11, color: rgb(0.3, 0.3, 0.3) });
  y -= 40;
  bankPage.drawText("Date: 01-04-2026 Amount: INR 50.00 Type: DEBIT Balance: INR 99016.09 Description: UPI/DR/073479210545/Mr YASH/CBIN/8010057938axl/Pa", {
    x: 50, y, font, size: 10
  });
  y -= 30;
  bankPage.drawText("Date: 02-04-2026 Amount: INR 499.00 Type: DEBIT Balance: INR 98517.09 Description: NETFLIX.COM ENTERTAINMENT MUMBAI", {
    x: 50, y, font, size: 10
  });
  y -= 30;
  bankPage.drawText("Date: 05-04-2026 Amount: INR 45000.00 Type: CREDIT Balance: INR 143517.09 Description: SALARY CREDIT ACME CORP", {
    x: 50, y, font, size: 10
  });

  const bankBytes = await bankDoc.save();
  fs.writeFileSync(path.join(targetDir, "bank-statement-sample.pdf"), bankBytes);

  // 4. Scanned/Empty Sample PDF (for testing OCR error detection)
  const emptyDoc = await PDFDocument.create();
  emptyDoc.addPage([595, 842]); // blank page without text
  const emptyBytes = await emptyDoc.save();
  fs.writeFileSync(path.join(targetDir, "empty-scanned-sample.pdf"), emptyBytes);

  // 5. Sample CSVs
  const standardCsv = `date,description,amount,type,currency
2026-09-01,NETFLIX,499.00,DEBIT,INR
2026-09-05,SALARY,45000.00,CREDIT,INR
2026-09-10,SPOTIFY INDIA,119.00,DEBIT,INR
2026-09-15,SWIGGY BANGALORE,350.00,DEBIT,INR`;
  fs.writeFileSync(path.join(targetDir, "standard-sample.csv"), standardCsv);

  const bankACsv = `Transaction Date,Narration,Debit,Credit
01/09/2026,NETFLIX.COM,499.00,
05/09/2026,SALARY CREDIT,,45000.00
12/09/2026,AMAZON PAY INDIA,1499.00,
18/09/2026,ZOMATO ORDER,420.00,`;
  fs.writeFileSync(path.join(targetDir, "bank-a-sample.csv"), bankACsv);

  const bankBCsv = `Txn Date,Particulars,Withdrawal,Deposit
01-Sep-2026,NETFLIX,499.00,
05-Sep-2026,SALARY,,"45000.00"
14-Sep-2026,MICROSOFT 365,619.00,
20-Sep-2026,GOOGLE STORAGE,130.00,`;
  fs.writeFileSync(path.join(targetDir, "bank-b-sample.csv"), bankBCsv);
}

