// services/voucherImportService.js
import xlsx from "xlsx";
import csvParser from "csv-parser";
import fs from "fs";

class VoucherImportService {
  async importFromExcel(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = xlsx.utils.sheet_to_json(sheet);

      return this.formatVouchers(data);
    } catch (error) {
      throw new Error(`Error reading Excel file: ${error.message}`);
    }
  }

  async importFromCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (data) => results.push(data))
        .on("end", () => {
          resolve(this.formatVouchers(results));
        })
        .on("error", (error) => {
          reject(new Error(`Error reading CSV file: ${error.message}`));
        });
    });
  }

  formatVouchers(rawData) {
    return rawData.map((item) => {
      // Format mapping dari kolom Excel ke field database
      return {
        voucher_code:
          item["Voucher code"] || item["Voucher code"] || item["voucher_code"],
        user_group:
          item["User group"] || item["User group"] || item["user_group"],
        status: this.mapStatus(item["Status"]),
        disabled: this.mapBoolean(item["Disabled"]),
        price: parseFloat(item["Price"]) || 0,
        period: item["Period"] || item["period"],
        first_name: item["First name"] || item["First name"] || "",
        last_name: item["Last name"] || item["Last name"] || "",
        alias: item["Alias"] || item["alias"],
        phone_number: item["Phone number"] || item["Phone number"] || "",
        created_time: this.parseDate(item["Created at"]),
        activated_time: this.parseDate(item["Activated at"]),
        expired_time: this.parseDate(item["Expired at"]),
        devices: item["Devices"] || item["devices"],
        mac_binding: this.mapBoolean(item["MAC Binding"]),
        trafic_used_total:
          item["Traffic Used/Total"] || item["Traffic Used/Total"],
        upload_download_limit:
          item["Upload/Download limit"] || item["Upload/Download limit"],
        is_printed: false,
        print_count: 0,
      };
    });
  }

  mapStatus(status) {
    if (!status) return "Not used";
    const statusMap = {
      "Not used": "Not used",
      Used: "Used",
      Active: "Active",
      Expired: "Expired",
      Disabled: "Disabled",
    };
    return statusMap[status] || "Not used";
  }

  mapBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      return (
        value.toLowerCase() === "yes" ||
        value.toLowerCase() === "true" ||
        value === "1"
      );
    }
    return false;
  }

  parseDate(dateString) {
    if (!dateString || dateString === "-" || dateString === "NULL") return null;

    // Coba berbagai format tanggal
    const dateFormats = [
      "YYYY/MM/DD HH:mm:ss",
      "YYYY-MM-DD HH:mm:ss",
      "DD/MM/YYYY HH:mm:ss",
      "MM/DD/YYYY HH:mm:ss",
    ];

    for (const format of dateFormats) {
      const date = this.tryParseDate(dateString, format);
      if (date) return date;
    }

    return new Date(dateString) || null;
  }

  tryParseDate(dateString, format) {
    try {
      // Implementasi sederhana - bisa diganti dengan moment.js atau date-fns
      if (format === "YYYY/MM/DD HH:mm:ss") {
        const [datePart, timePart] = dateString.split(" ");
        const [year, month, day] = datePart.split("/");
        const [hours, minutes, seconds] = timePart.split(":");
        return new Date(year, month - 1, day, hours, minutes, seconds);
      }
    } catch (error) {
      return null;
    }
    return null;
  }
}

export default new VoucherImportService();
