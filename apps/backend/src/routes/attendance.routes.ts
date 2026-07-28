import { Router } from 'express';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth';
import { PERMISSIONS } from '@mahallu/shared-config';
import { Attendance } from '../models/Attendance';
import { AuthRequest } from '../middleware/auth';
import { AttendanceStatus } from '@mahallu/shared-types';
import dayjs from 'dayjs';
import { Student } from '../models/Student';
import { Teacher } from '../models/Teacher';
import { Member } from '../models/Member';
const r = Router();
r.use(authenticate);

r.post('/bulk', authorize(PERMISSIONS.ATTENDANCE_MARK), async (req: AuthRequest, res, next) => {
  try {
    const { records, classId, date, entityType } = req.body;
    const tenantId = req.user!.tenantId;
    const ops = records.map((record: { entityId: string; status: AttendanceStatus; date?: string }) => {
      const recordDate = record.date ? new Date(record.date) : new Date(date);
      return {
        updateOne: {
          filter: {
            tenantId: new mongoose.Types.ObjectId(tenantId),
            entityId: new mongoose.Types.ObjectId(record.entityId),
            date: recordDate
          },
          update: {
            $set: {
              tenantId: new mongoose.Types.ObjectId(tenantId),
              entityId: new mongoose.Types.ObjectId(record.entityId),
              entityType,
              classId: classId ? new mongoose.Types.ObjectId(classId) : undefined,
              date: recordDate,
              status: record.status,
              markedById: new mongoose.Types.ObjectId(req.user!.userId)
            }
          },
          upsert: true,
        }
      };
    });
    await Attendance.bulkWrite(ops);
    res.json({ success: true, message: `${records.length} attendance records saved` });
  } catch (e) { next(e); }
});

r.get('/class/:classId', authorize(PERMISSIONS.ATTENDANCE_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { date } = req.query;
    const queryDate = date ? new Date(date as string) : dayjs().startOf('day').toDate();
    queryDate.setHours(0, 0, 0, 0);

    const students = await Student.find({
      tenantId: req.user!.tenantId,
      classId: req.params.classId,
      status: 'active',
      isDeleted: { $ne: true }
    }).populate({ path: 'memberId', select: 'name', options: { strictPopulate: false } }).lean();

    const records = await Attendance.find({
      tenantId: req.user!.tenantId,
      classId: req.params.classId,
      date: queryDate,
    }).lean();

    const recordsMap = new Map(records.map(r => [r.entityId?.toString() || '', r]));

    const data = students.map((s: any) => {
      const savedRecord = recordsMap.get(s._id.toString());
      return {
        _id: savedRecord?._id || undefined,
        entityId: {
          _id: s._id,
          name: s.memberId?.name || s.name || 'Unknown Student',
          admissionNo: s.admissionNo || '—'
        },
        date: queryDate,
        status: savedRecord?.status || 'present',
        isSaved: !!savedRecord
      };
    });

    res.json({ success: true, data });
  } catch (e) { next(e); }
});

r.get('/class/:classId/monthly', authorize(PERMISSIONS.ATTENDANCE_VIEW), async (req: AuthRequest, res, next) => {
  try {
    const { year, month } = req.query;
    const y = parseInt(year as string) || new Date().getFullYear();
    const m = parseInt(month as string) || (new Date().getMonth() + 1);

    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0);
    endDate.setHours(23, 59, 59, 999);

    const records = await Attendance.find({
      tenantId: req.user!.tenantId,
      classId: req.params.classId,
      date: { $gte: startDate, $lte: endDate }
    }).select('entityId date status').lean();

    const students = await Student.find({
      tenantId: req.user!.tenantId,
      classId: req.params.classId,
      status: 'active',
      isDeleted: { $ne: true }
    }).populate({ path: 'memberId', select: 'name', options: { strictPopulate: false } }).lean();

    const formattedStudents = students.map((s: any) => ({
      _id: s._id,
      name: s.memberId?.name || s.name || 'Unknown Student',
      admissionNo: s.admissionNo || '—'
    }));

    res.json({
      success: true,
      data: {
        students: formattedStudents,
        records: records.map((r: any) => ({
          entityId: r.entityId,
          date: r.date,
          status: r.status
        }))
      }
    });
  } catch (e) { next(e); }
});

r.get('/report', authorize(PERMISSIONS.ATTENDANCE_REPORTS), async (req: AuthRequest, res, next) => {
  try {
    const { classId, startDate, endDate, entityType } = req.query;
    const filter: Record<string, unknown> = { tenantId: req.user!.tenantId, entityType };
    if (classId) filter.classId = classId;
    if (startDate && endDate) filter.date = { $gte: new Date(startDate as string), $lte: new Date(endDate as string) };
    const data = await Attendance.aggregate([
      { $match: filter },
      { $group: { _id: { entityId: '$entityId', status: '$status' }, count: { $sum: 1 } } },
      { $group: { _id: '$_id.entityId', attendance: { $push: { status: '$_id.status', count: '$count' } } } },
    ]);
    res.json({ success: true, data });
  } catch (e) { next(e); }
});

export default r;
