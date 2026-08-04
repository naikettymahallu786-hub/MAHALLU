import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Readable } from 'stream';
import ExcelJS from 'exceljs';
import bcrypt from 'bcryptjs';
import { Family, Member, User, ImportExportLog, Tenant } from '../models';
import { UserRole, MemberStatus, Gender } from '@mahallu/shared-types';
import { logger } from '../config/logger';

export class ImportExportController {
  /**
   * Download Demo Excel Template for importing Families and Members
   */
  static async downloadTemplate(req: AuthRequest, res: Response) {
    try {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Family & Member Import');

      // Title & Instructions Row
      sheet.addRow(['MAHALLU ERP - FAMILY & MEMBERS IMPORT TEMPLATE']);
      sheet.addRow(['Fill in family and member details below. Required fields are marked with (*).']);
      sheet.addRow([]); // Blank row

      // Header Columns
      const headers = [
        'Mahallu Code',
        'Family Code / House Name*',
        'Address Line*',
        'Ward No',
        'Family Email (Login)',
        'Family Password (Login)',
        'Member Name*',
        'Gender (male/female)*',
        'DOB (YYYY-MM-DD)',
        'Phone*',
        'Relationship (head/spouse/child/parent)*',
        'Occupation',
        'Aadhaar Number',
      ];
      const headerRow = sheet.addRow(headers);

      // Styling Header Row
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '1E40AF' }, // Dark Blue
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      // Sample Demo Data Rows
      sheet.addRow([
        'MH001',
        'FAM-101 (Baitul Noor)',
        'Near Juma Masjid, Ward 4',
        '04',
        'ahmed.family@mahallu.app',
        'Pass1234',
        'Ahmed K',
        'male',
        '1985-05-12',
        '9876543210',
        'head',
        'Business',
        '123456789012',
      ]);
      sheet.addRow([
        'MH001',
        'FAM-101 (Baitul Noor)',
        'Near Juma Masjid, Ward 4',
        '04',
        'ahmed.family@mahallu.app',
        'Pass1234',
        'Fatima Ahmed',
        'female',
        '1988-08-20',
        '9876543211',
        'spouse',
        'Homemaker',
        '123456789013',
      ]);
      sheet.addRow([
        'MH001',
        'FAM-101 (Baitul Noor)',
        'Near Juma Masjid, Ward 4',
        '04',
        'ahmed.family@mahallu.app',
        'Pass1234',
        'Zayd Ahmed',
        'male',
        '2012-03-15',
        '9876543212',
        'child',
        'Student',
        '123456789014',
      ]);

      // Auto width columns
      sheet.columns.forEach((column) => {
        column.width = 24;
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Demo_Import_Template_Families_Members.xlsx"');

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error generating import template:', error);
      res.status(500).json({ success: false, message: 'Failed to generate import template' });
    }
  }

  /**
   * Bulk Import Families and Members from Excel (.xlsx) / CSV (.csv)
   */
  static async importData(req: AuthRequest, res: Response) {
    let logId: string | null = null;
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No spreadsheet file uploaded' });
      }

      const tenantId = req.user!.tenantId;
      const isCsv = req.file.originalname.toLowerCase().endsWith('.csv') || req.file.mimetype === 'text/csv';

      logger.info(`[Import] Starting file parse for ${req.file.originalname} (${req.file.size} bytes)`);

      const workbook = new ExcelJS.Workbook();

      if (isCsv) {
        const stream = Readable.from(req.file.buffer);
        await workbook.csv.read(stream);
      } else {
        try {
          await workbook.xlsx.load(req.file.buffer as any);
        } catch (excelError: any) {
          logger.error(`[Import] ExcelJS load failed: ${excelError.message}`);
          return res.status(400).json({
            success: false,
            message: 'Invalid file format. Please upload a valid Excel (.xlsx) file. Excel 97-2003 (.xls) format is not supported.',
          });
        }
      }

      const sheet = workbook.worksheets[0];
      if (!sheet) {
        logger.warn('[Import] Worksheet not found in workbook');
        return res.status(400).json({ success: false, message: 'File is empty' });
      }

      logger.info(`[Import] Sheet loaded. Total rows: ${sheet.rowCount}, Actual rows: ${sheet.actualRowCount}`);

      let totalRecords = 0;
      let successCount = 0;
      let failedCount = 0;
      const errorDetails: Array<{ row: number; message: string }> = [];

      logger.info('[Import] Pre-fetching existing families, members, and users to build in-memory cache...');
      const [existingFamilies, existingMembers, existingUsers] = await Promise.all([
        Family.find({ tenantId }),
        Member.find({ tenantId }),
        User.find({ tenantId }),
      ]);

      const familyCache = new Map<string, any>();
      existingFamilies.forEach(f => {
        familyCache.set(f.familyCode, f);
      });

      const memberCache = new Map<string, any>();
      existingMembers.forEach(m => {
        memberCache.set(`${m.phone}_${m.name.toLowerCase()}`, m);
      });

      const userCache = new Map<string, any>();
      existingUsers.forEach(u => {
        userCache.set(u.email.toLowerCase(), u);
      });

      logger.info(`[Import] Cache built: ${familyCache.size} families, ${memberCache.size} members, ${userCache.size} users.`);

      // Automatically detect header row
      let startRowIndex = 2;
      sheet.eachRow((row, rowNumber) => {
        const rowStr = JSON.stringify(row.values).toLowerCase();
        if (rowStr.includes('family code') || rowStr.includes('member name')) {
          startRowIndex = rowNumber + 1;
        }
      });

      logger.info(`[Import] startRowIndex set to ${startRowIndex}`);

      const rowList: any[] = [];
      sheet.eachRow((row, rowNumber) => {
        if (rowNumber >= startRowIndex) {
          rowList.push({ row, rowNumber });
        }
      });

      logger.info(`[Import] Extracted ${rowList.length} rows to process.`);
      totalRecords = rowList.length;

      // Create log document as 'PROCESSING' at start
      const log = await ImportExportLog.create({
        tenantId,
        type: 'IMPORT',
        entity: 'FAMILIES_MEMBERS',
        fileName: req.file.originalname,
        status: 'PROCESSING',
        totalRecords,
        successCount: 0,
        failedCount: 0,
        errorDetails: [],
        performedBy: req.user?.name || 'Admin',
      });
      logId = log._id.toString();

      const familyMap = new Map<string, any>();
      let processedRows = 0;
      for (const item of rowList) {
        const { row, rowNumber } = item;

        const getVal = (colIdx: number) => {
          const val = row.getCell(colIdx).value;
          if (!val) return '';
          if (typeof val === 'object' && 'text' in val) return String(val.text || '').trim();
          return String(val).trim();
        };

        const mahalluCode = getVal(1);
        const familyCode = getVal(2);
        const addressLine = getVal(3);
        const wardNo = getVal(4);
        const familyEmail = getVal(5).toLowerCase();
        const familyPassword = getVal(6);
        const memberName = getVal(7);
        const gender = getVal(8).toLowerCase();
        const dob = getVal(9);
        const phone = getVal(10);
        const relationship = getVal(11).toLowerCase();
        const occupation = getVal(12);
        const aadhaar = getVal(13);

        if (!familyCode && !memberName) {
          totalRecords--; // Reduce totalRecords for empty skipped rows
          continue;
        }

        processedRows++;

        // Basic Row Validation
        const missingFields: string[] = [];
        if (!familyCode) missingFields.push('Family Code / House Name');
        if (!addressLine) missingFields.push('Address Line');
        if (!memberName) missingFields.push('Member Name');
        if (!gender) missingFields.push('Gender');
        if (!phone) missingFields.push('Phone');

        if (missingFields.length > 0) {
          failedCount++;
          const errStr = `Missing required fields: ${missingFields.join(', ')}`;
          errorDetails.push({
            row: rowNumber,
            message: errStr,
          });
          continue;
        }

        try {
          // Find or create Family (from memory map)
          let family = familyMap.get(familyCode) || familyCache.get(familyCode);
          if (!family) {
            family = await Family.create({
              tenantId,
              familyCode,
              address: {
                line1: addressLine,
                city: 'Mahallu City',
                district: 'State',
                state: 'Kerala',
                pincode: '670001',
                country: 'India',
              },
              wardNo,
              members: [],
              outstandingBalance: 0,
              recurringDonationType: 'none',
              recurringDonationAmount: 0,
            });
            familyCache.set(familyCode, family);
            familyMap.set(familyCode, family);
          }

          // Check if Member already exists by phone & tenantId (from memory map)
          const memberKey = `${phone}_${memberName.toLowerCase()}`;
          let member = memberCache.get(memberKey);
          const isHead = relationship === 'head' || relationship === 'head of family' || family.members.length === 0;

          // Parse DOB safely
          let dateOfBirth: Date | undefined = undefined;
          if (dob) {
            const rawDob = row.getCell(9).value;
            if (rawDob instanceof Date) {
              dateOfBirth = rawDob;
            } else {
              const d = new Date(dob);
              if (!isNaN(d.getTime())) {
                dateOfBirth = d;
              }
            }
          }

          if (!member) {
            member = await Member.create({
              tenantId,
              memberId: `M-${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 100)}`,
              name: memberName,
              gender: gender === 'female' ? Gender.FEMALE : Gender.MALE,
              phone,
              email: familyEmail || undefined,
              dateOfBirth,
              occupation,
              aadhaarNumber: aadhaar,
              familyId: family._id,
              relationship: relationship || 'member',
              status: MemberStatus.ACTIVE,
            });
            memberCache.set(memberKey, member);
          }

          // Attach member to Family if not present
          const existingRef = family.members.find((m: any) => String(m.memberId) === String(member._id));
          if (!existingRef) {
            family.members.push({
              memberId: member._id,
              relationship: relationship || 'member',
              isHead,
            });
          }
          if (isHead || !family.headMemberId) {
            family.headMemberId = member._id;
          }
          await family.save();

          // Create or update User login account if Password and Email/Phone are provided
          const userIdentifier = familyEmail || phone;
          if (userIdentifier && familyPassword) {
            let user = userCache.get(userIdentifier);
            if (!user) {
              try {
                const queryConditions: any[] = [];
                if (familyEmail) queryConditions.push({ email: familyEmail });
                if (phone) queryConditions.push({ phone });

                let existingUser = null;
                if (queryConditions.length > 0) {
                  existingUser = await User.findOne({
                    tenantId,
                    $or: queryConditions,
                  });
                }

                if (existingUser) {
                  existingUser.passwordHash = familyPassword;
                  if (member._id) existingUser.memberId = member._id;
                  await existingUser.save();
                  user = existingUser;
                } else {
                  user = await User.create({
                    tenantId,
                    email: familyEmail || `${phone.replace(/\D/g, '') || Date.now()}@mahallu.local`,
                    phone: phone || '+910000000000',
                    name: memberName,
                    passwordHash: familyPassword,
                    role: UserRole.PARENT,
                    memberId: member._id,
                    isEmailVerified: true,
                    isPhoneVerified: true,
                    isActive: true,
                  });
                }
                userCache.set(userIdentifier, user);

                member.userId = user._id;
                await member.save();
              } catch (userErr: any) {
                logger.warn(`[Import] Row ${rowNumber} - User login account creation skipped: ${userErr.message}`);
              }
            }
          }

          successCount++;
        } catch (err: any) {
          logger.error(`[Import] Row ${rowNumber} - Error: ${err.message}`);
          failedCount++;
          let msg = err.message || 'Error processing row';
          
          if (err.name === 'ValidationError') {
            const paths = Object.keys(err.errors);
            msg = `Validation failed: ${paths.map(p => {
              const e = err.errors[p];
              if (e.kind === 'enum') {
                return `"${e.value}" is not a valid option for ${p} (must be one of: ${e.properties.enumValues.join(', ')})`;
              }
              return e.message;
            }).join(', ')}`;
          } else if (err.code === 11000) {
            const keyValueObj = err.keyValue || {};
            const keys = Object.keys(keyValueObj).filter(k => k !== 'tenantId');
            const key = keys[0] || Object.keys(keyValueObj)[0] || '';
            const val = keyValueObj[key] || '';

            if (key === 'phone') {
              msg = `Duplicate phone number: "${val}" is already registered to another member/user.`;
            } else if (key === 'email') {
              msg = `Duplicate email address: "${val}" is already registered to another family/user.`;
            } else if (key === 'familyCode') {
              msg = `Duplicate family code: "${val}" already exists in database.`;
            } else if (key === 'memberId') {
              msg = `Duplicate member ID: "${val}" already exists in database.`;
            } else if (key) {
              msg = `Duplicate entry found for ${key}: "${val}"`;
            } else {
              msg = `Duplicate entry error: Record already exists in database.`;
            }
          }
          
          errorDetails.push({
            row: rowNumber,
            message: msg,
          });
        }

        // Periodically update database log with status progress (every 50 rows)
        if (processedRows % 50 === 0 || processedRows === totalRecords) {
          logger.info(`[Import] Progress: ${processedRows}/${totalRecords} rows processed.`);
          await ImportExportLog.findByIdAndUpdate(logId, {
            totalRecords,
            successCount,
            failedCount,
            errorDetails,
          });
        }
      }

      logger.info(`[Import] Loop completed. Success: ${successCount}, Failed: ${failedCount}`);

      // Finalize log document
      await ImportExportLog.findByIdAndUpdate(logId, {
        status: 'COMPLETED',
        totalRecords,
        successCount,
        failedCount,
        errorDetails,
      });

      return res.status(200).json({
        success: true,
        message: `Import processed: ${successCount} succeeded, ${failedCount} failed`,
        data: {
          logId,
          totalRecords,
          successCount,
          failedCount,
          errorDetails,
        },
      });
    } catch (error: any) {
      logger.error(`[Import] Request level crash: ${error.message}`);
      if (logId) {
        try {
          await ImportExportLog.findByIdAndUpdate(logId, {
            status: 'FAILED',
            errorDetails: [{ row: 0, message: error.message || 'Request level crash' }],
          });
        } catch (dbErr) {
          logger.error(`[Import] Failed to mark log as FAILED: ${dbErr}`);
        }
      }
      return res.status(500).json({ success: false, message: error.message || 'Failed to process import' });
    }
  }

  /**
   * Export All Families & Members as Excel Workbook
   */
  static async exportData(req: AuthRequest, res: Response) {
    try {
      const tenantId = req.user!.tenantId;
      const tenant = await Tenant.findById(tenantId);
      const families = await Family.find({ tenantId }).populate('members.memberId');
      const members = await Member.find({ tenantId });

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Exported Families & Members');

      // Title Row
      sheet.addRow([`MAHALLU ERP - EXPORTED FAMILIES & MEMBERS (${tenant?.name || 'Mahallu'})`]);
      sheet.addRow([`Export Date: ${new Date().toLocaleDateString()} | Total Families: ${families.length} | Total Members: ${members.length}`]);
      sheet.addRow([]);

      // Headers
      const headers = [
        'Family Code',
        'Ward No',
        'Address Line 1',
        'City',
        'Member Name',
        'Gender',
        'Phone',
        'Relationship to Head',
        'Occupation',
        'Aadhaar Number',
        'Member Status',
      ];
      const headerRow = sheet.addRow(headers);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '10B981' }, // Emerald Green
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      let totalExported = 0;

      members.forEach((m) => {
        const family = families.find((f) => String(f._id) === String(m.familyId));
        sheet.addRow([
          family?.familyCode || 'N/A',
          family?.wardNo || 'N/A',
          family?.address?.line1 || 'N/A',
          family?.address?.city || 'N/A',
          m.name,
          m.gender,
          m.phone,
          m.relationship || 'member',
          m.occupation || '',
          m.aadhaarNumber || '',
          m.status,
        ]);
        totalExported++;
      });

      sheet.columns.forEach((col) => {
        col.width = 22;
      });

      // Save Export Log
      await ImportExportLog.create({
        tenantId,
        type: 'EXPORT',
        entity: 'FAMILIES_MEMBERS',
        fileName: `Export_Families_Members_${Date.now()}.xlsx`,
        status: 'COMPLETED',
        totalRecords: totalExported,
        successCount: totalExported,
        failedCount: 0,
        errorDetails: [],
        performedBy: req.user?.name || 'Admin',
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="Export_Families_Members_${Date.now()}.xlsx"`);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ success: false, message: 'Failed to export families and members' });
    }
  }

  /**
   * Get Import & Export History Logs
   */
  static async getHistory(req: AuthRequest, res: Response) {
    try {
      const logs = await ImportExportLog.find({ tenantId: req.user!.tenantId }).sort({ createdAt: -1 }).limit(50);
      res.status(200).json({ success: true, data: logs });
    } catch (error) {
      console.error('Error fetching import export history:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch history logs' });
    }
  }
}
