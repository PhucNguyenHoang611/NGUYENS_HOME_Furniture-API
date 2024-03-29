const mongoose = require("mongoose");
const Staff = require("../../models/staff");
const ErrorResponse = require("../../utils/errorResponse");

exports.getCurrentStaff = async (req, res, next) => {
    try {
        res.status(200).json({
            success: true,
            message: "Get current staff successfully",
            data: req.user
        });
    } catch (error) {
        next(error);
    }
};

exports.getAllStaffs = async (req, res, next) => {
    let options = { privilege: { $gte: 0 } };

    let total = Staff.countDocuments(options);
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || parseInt(await total);
    let last_page = Math.ceil(parseInt(await total)/limit);
    if (last_page < 1 && total > 0) {
        last_page = 1
    }

    try {
        const staffs = await Staff.find(options);
        res.status(200).json({
            success: true,
            message: "List of staffs fetched successfully",
            data: staffs,
            total: (await total).toString(),
            page: (await page).toString(),
            last_page: (await last_page).toString()
        });
    } catch (error) {
        next(error);
    }
};

exports.getStaffById = async (req, res, next) => {
    const { staffId } = req.params;

    if (!staffId || !mongoose.Types.ObjectId.isValid(staffId))
        return next(new ErrorResponse("Please provide valid staff's ID", 400));

    try {
        const staff = await Staff.findById(staffId);

        if (!staff)
            return next(new ErrorResponse("No staff found", 404));
        
        res.status(200).json({
            success: true,
            data: staff
        });
    } catch (error) {
        next(error);
    }
};

exports.updateStaff = async (req, res, next) => {
    const { staffId } = req.params;

    if (!staffId)
        return next(new ErrorResponse("Please provide valid staff's ID", 400));

    const { staffFirstName, staffLastName, staffEmail, staffPhone, staffGender, privilege } = req.body;

    try {
        const staff = await Staff.findByIdAndUpdate(staffId, {
            staffFirstName,
            staffLastName,
            staffEmail,
            staffPhone,
            staffGender,
            privilege
        });

        if (staff) {
            res.status(200).json({
                success: true,
                message: "Staff updated successfully",
                data: staff
            });
        } else {
            return next(new ErrorResponse("Staff not found", 404));
        }
    } catch (error) {
        next(error);
    }
};

exports.changeStaffPassword = async (req, res, next) => {
    const { staffId } = req.params;
    const { staffOldPassword, staffNewPassword } = req.body;

    try {
        const staff = await Staff.findById(staffId).select("+staffPassword");

        if (!staff) return next(new ErrorResponse("No staff found", 404));

        const passwordValid = await staff.checkPassword(staffOldPassword);
        if (!passwordValid)
            return next(new ErrorResponse("Incorrect old password", 401));

        await staff.updatePassword(staffNewPassword);

        res.status(201).json({
            success: true,
            message: "Change password successfully",
        });
    } catch (error) {
        next(error);
    }
};

exports.deleteStaff = async (req, res, next) => {
    const { staffId } = req.params;

    if (!staffId)
        return next(new ErrorResponse("Please provide valid staff's ID", 400));

    try {
        const staff = await Staff.findByIdAndDelete(staffId);

        if (!staff)
            return next(new ErrorResponse("No staff found", 404));

        res.status(200).json({
            success: true,
            message: "Staff deleted successfully",
            data: staff
        });
    } catch (error) {
        next(error);
    }
};

exports.activeOrInactiveStaff = async (req, res, next) => {
    const { staffId } = req.params;

    if (!staffId)
        return next(new ErrorResponse("Please provide valid staff's ID", 400));

    try {
        const staff = await Staff.findById(staffId);

        if (!staff)
            return next(new ErrorResponse("No staff found", 404));

        await staff.updateOne({
            staffStatus: (staff.staffStatus === 0) ? -1 : 0
        });
        await staff.save();

        res.status(200).json({
            success: true,
            message: `Staff ${staff.staffStatus === 0 ? "deactivated" : "activated"} successfully`
        });
    } catch (error) {
        next(error);
    }
};