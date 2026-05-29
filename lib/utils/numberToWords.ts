/**
 * Utility to convert numeric amounts to standard Vietnamese words.
 * Crucial for Vietnamese Receipt Vouchers (Phiếu thu) and Payment Vouchers (Phiếu chi).
 */

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

function readGroup3(group: number, showZeroHundred: boolean): string {
  const h = Math.floor(group / 100);
  const t = Math.floor((group % 100) / 10);
  const u = group % 10;
  let res = "";

  if (h > 0 || showZeroHundred) {
    res += DIGITS[h] + " trăm ";
  }

  if (t === 0) {
    if (h > 0 && u > 0) {
      res += "lẻ ";
    }
  } else if (t === 1) {
    res += "mười ";
  } else {
    res += DIGITS[t] + " mươi ";
  }

  if (u === 1) {
    if (t > 1) {
      res += "mốt";
    } else {
      res += "một";
    }
  } else if (u === 5) {
    if (t > 0) {
      res += "lăm";
    } else {
      res += "năm";
    }
  } else if (u > 0) {
    res += DIGITS[u];
  }

  return res.trim();
}

export function numberToVietnameseWords(amount: number | bigint): string {
  let num = Math.floor(Number(amount));
  if (num === 0) return "Không đồng chẵn.";

  let sign = "";
  if (num < 0) {
    sign = "Âm ";
    num = -num;
  }

  const units = ["", " nghìn", " triệu", " tỷ"];
  let groups: number[] = [];

  while (num > 0) {
    groups.push(num % 1000);
    num = Math.floor(num / 1000);
  }

  let words = "";
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) {
      if (i === 3 && groups.length > 4) {
        words += " tỷ";
      }
      continue;
    }

    const showZeroHundred = i < groups.length - 1;
    const groupText = readGroup3(group, showZeroHundred);
    
    const unitIndex = i % 4;
    const suffix = units[unitIndex];
    
    words += " " + groupText + suffix;
    
    if (i >= 4 && i % 4 === 0) {
      words += " tỷ";
    }
  }

  let result = (sign + words.trim()).replace(/\s+/g, " ");
  result = result.charAt(0).toUpperCase() + result.slice(1) + " đồng chẵn.";
  return result;
}
