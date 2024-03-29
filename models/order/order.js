const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var orderSchema = new Schema(
    {
        customerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: [true, "Please provide customer's ID"],
            trim: true
        },
        staffId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Staff",
            trim: true,
            default: null
        },
        orderCode: {
            type: String,
            required: [true, "Please provide order's code"],
            trim: true
        },
        orderStatus: {
            type: String,
            required: [true, "Please provide order's status"], // If Required
            enum: {
                values: [
                    "Đặt hàng",
                    "Đã xác nhận",
                    "Đang vận chuyển",
                    "Đã hoàn tất",
                    "Đã hủy",
                    "Bị trả lại"
                ],
                message: "{VALUE} is not supported as order's status"
            }
        },
        orderNote: {
            type: String,
            trim: true
        },
        orderAddress: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Address",
            required: [true, "Please provide order's address"],
            trim: true
        },
        paymentMethod: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Payment",
            required: [true, "Please provide payment's ID"],
            trim: true
        },
        orderShippingFee: {
            type: Number,
            default: 0
        },
        orderCompleteDay: {
            type: Date
        },
        voucherId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Voucher",
            trim: true,
            default: null
        }
    },
    { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - customerId
 *         - orderCode
 *         - orderStatus
 *         - orderAddress
 *         - paymentMethod
 *       properties:
 *         customerId:
 *           type: string
 *         staffId:
 *           type: string
 *         orderCode:
 *           type: string
 *         orderStatus:
 *           type: string
 *         orderNote:
 *           type: string
 *         orderAddress:
 *           type: string
 *         paymentMethod:
 *           type: string
 *         orderShippingFee:
 *           type: number
 *         orderCompleteDay:
 *           type: string
 *         voucherId:
 *           type: string
 */