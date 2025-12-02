import { PrismaClient } from "@prisma/client";
import VocherImportService from "../../Services/VoucherImportService.js";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

class VoucherController {
  // GET /vouchers
  async getVouchers(req, res) {
    try {
      const { page = 1, limit = 10, status, user_group, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const where = {};

      if (status) {
        where.status = status;
      }

      if (user_group) {
        where.user_group = user_group;
      }

      if (search) {
        where.OR = [
          { voucher_code: { contains: search, mode: "insensitive" } },
          { first_name: { contains: search, mode: "insensitive" } },
          { last_name: { contains: search, mode: "insensitive" } },
          { alias: { contains: search, mode: "insensitive" } },
          { phone_number: { contains: search, mode: "insensitive" } },
        ];
      }

      const [vouchers, total] = await Promise.all([
        prisma.voucher.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { created_at: "desc" },
        }),
        prisma.voucher.count({ where }),
      ]);

      return res.status(200).json({
        status: true,
        data: vouchers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      return res.status(500).json({
        status: false,
        message: "INTERNAL_SERVER_ERROR",
        error: error.message,
      });
    }
  }

  // GET /vouchers/:id
  async getVoucherById(req, res) {
    try {
      const { id } = req.params;

      const voucher = await prisma.voucher.findUnique({
        where: { id: parseInt(id) },
      });

      if (!voucher) {
        return res.status(404).json({
          status: false,
          message: "VOUCHER_NOT_FOUND",
        });
      }

      return res.status(200).json({
        status: true,
        data: voucher,
      });
    } catch (error) {
      console.error("Error fetching voucher:", error);
      return res.status(500).json({
        status: false,
        message: "INTERNAL_SERVER_ERROR",
        error: error.message,
      });
    }
  }

  // POST /vouchers
  async createVoucher(req, res) {
    try {
      const voucherData = req.body;

      // Generate voucher code jika tidak disediakan
      if (!voucherData.voucher_code) {
        voucherData.voucher_code = this.generateVoucherCode(8);
      }

      // Cek duplikasi voucher code
      const existingVoucher = await prisma.voucher.findFirst({
        where: { voucher_code: voucherData.voucher_code },
      });

      if (existingVoucher) {
        return res.status(400).json({
          status: false,
          message: "VOUCHER_CODE_ALREADY_EXISTS",
        });
      }

      const voucher = await prisma.voucher.create({
        data: {
          ...voucherData,
          created_time: voucherData.created_time || new Date(),
          status: voucherData.status || "Not used",
        },
      });

      return res.status(201).json({
        status: true,
        message: "VOUCHER_CREATED_SUCCESSFULLY",
        data: voucher,
      });
    } catch (error) {
      console.error("Error creating voucher:", error);
      return res.status(500).json({
        status: false,
        message: "INTERNAL_SERVER_ERROR",
        error: error.message,
      });
    }
  }

  // PUT /vouchers/:id
  async updateVoucher(req, res) {
    try {
      const { id } = req.params;
      const voucherData = req.body;

      // Cek apakah voucher exists
      const existingVoucher = await prisma.voucher.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingVoucher) {
        return res.status(404).json({
          status: false,
          message: "VOUCHER_NOT_FOUND",
        });
      }

      // Cek duplikasi voucher code jika diupdate
      if (
        voucherData.voucher_code &&
        voucherData.voucher_code !== existingVoucher.voucher_code
      ) {
        const duplicateVoucher = await prisma.voucher.findFirst({
          where: {
            voucher_code: voucherData.voucher_code,
            id: { not: parseInt(id) },
          },
        });

        if (duplicateVoucher) {
          return res.status(400).json({
            status: false,
            message: "VOUCHER_CODE_ALREADY_EXISTS",
          });
        }
      }

      const updatedVoucher = await prisma.voucher.update({
        where: { id: parseInt(id) },
        data: voucherData,
      });

      return res.status(200).json({
        status: true,
        message: "VOUCHER_UPDATED_SUCCESSFULLY",
        data: updatedVoucher,
      });
    } catch (error) {
      console.error("Error updating voucher:", error);
      return res.status(500).json({
        status: false,
        message: "INTERNAL_SERVER_ERROR",
        error: error.message,
      });
    }
  }

  // DELETE /vouchers/:id
  async deleteVoucher(req, res) {
    try {
      const { id } = req.params;

      // Cek apakah voucher exists
      const existingVoucher = await prisma.voucher.findUnique({
        where: { id: parseInt(id) },
      });

      if (!existingVoucher) {
        return res.status(404).json({
          status: false,
          message: "VOUCHER_NOT_FOUND",
        });
      }

      await prisma.voucher.delete({
        where: { id: parseInt(id) },
      });

      return res.status(200).json({
        status: true,
        message: "VOUCHER_DELETED_SUCCESSFULLY",
      });
    } catch (error) {
      console.error("Error deleting voucher:", error);
      return res.status(500).json({
        status: false,
        message: "INTERNAL_SERVER_ERROR",
        error: error.message,
      });
    }
  }

  // POST /vouchers/:id/print
  async printVoucher(req, res) {
    try {
      const { id } = req.params;

      const updatedVoucher = await prisma.voucher.update({
        where: { id: parseInt(id) },
        data: {
          is_printed: true,
          print_count: { increment: 1 },
          print_last_time: new Date(),
        },
      });

      return res.status(200).json({
        status: true,
        message: "VOUCHER_PRINTED_SUCCESSFULLY",
        data: updatedVoucher,
      });
    } catch (error) {
      console.error("Error printing voucher:", error);

      // Jika voucher tidak ditemukan
      if (error.code === "P2025") {
        return res.status(404).json({
          status: false,
          message: "VOUCHER_NOT_FOUND",
        });
      }

      return res.status(500).json({
        status: false,
        message: "INTERNAL_SERVER_ERROR",
        error: error.message,
      });
    }
  }

  // POST /vouchers/import
  async importVouchers(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          status: false,
          message: "NO_FILE_UPLOADED",
        });
      }

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      let vouchers;

      // Proses file berdasarkan ekstensi
      if (fileExtension === ".xlsx" || fileExtension === ".xls") {
        vouchers = await VocherImportService.importFromExcel(filePath);
      } else if (fileExtension === ".csv") {
        vouchers = await VocherImportService.importFromCSV(filePath);
      } else {
        // Hapus file yang tidak didukung
        fs.unlinkSync(filePath);
        return res.status(400).json({
          status: false,
          message: "UNSUPPORTED_FILE_FORMAT",
        });
      }

      if (!vouchers || vouchers.length === 0) {
        fs.unlinkSync(filePath);
        return res.status(400).json({
          status: false,
          message: "NO_VALID_DATA_FOUND",
        });
      }

      // Simpan ke database
      const results = await prisma.$transaction(
        vouchers.map((voucher) => prisma.voucher.create({ data: voucher }))
      );

      // Hapus file setelah diproses
      fs.unlinkSync(filePath);

      return res.status(201).json({
        status: true,
        message: "VOUCHERS_IMPORTED_SUCCESSFULLY",
        data: {
          importedCount: results.length,
          vouchers: results,
        },
      });
    } catch (error) {
      console.error("Error importing vouchers:", error);

      // Hapus file jika ada error
      if (req.file && req.file.path) {
        fs.unlinkSync(req.file.path);
      }

      return res.status(500).json({
        status: false,
        message: "IMPORT_FAILED",
        error: error.message,
      });
    }
  }

  // Helper: Generate random voucher code
  generateVoucherCode(length = 8) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

export default new VoucherController();
