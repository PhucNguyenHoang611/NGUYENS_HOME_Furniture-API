const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

var staffSchema = new Schema(
    {
        staffPassword: {
            type: String,
            required: [true, "Please add a password"],
            minlength: [8, "Password must have at least 8 characters"],
            select: false,
            trim: true
        },
        staffFirstName: {
            type: String,
            match: [
                /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s\W|_]+$/,
                "Invalid first name",
            ],
            required: [true, "Please provide staff's first name"],
            trim: true
        },
        staffLastName: {
            type: String,
            match: [
                /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ\s\W|_]+$/,
                "Invalid last name",
            ],
            required: [true, "Please provide staff's last name"],
            trim: true
        },
        staffEmail: {
            type: String,
            required: [true, "Please provide staff's email"],
            unique: [true, "Email is already registered"],
            match: [
                /^[a-z0-9_\.]{1,32}@[a-z0-9]{2,10}(\.[a-z0-9]{2,10}){1,}$/,
                "Invalid email",
            ],
            trim: true
        },
        staffPhone: {
            type: String,
            validate: [/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Invalid phone number"],
            required: [true, "Please provide staff's phone number"],
            unique: [true, "Phone number is already registered"]
        },
        staffGender: {
            type: String,
            trim: true
        },
        staffStartWork: {
            type: Date,
            default: Date.now()
        },
        staffStatus: {
            // 0: Still Working, -1: Quit Job
            type: Number,
            default: 0
        },
        privilege: {
            // 0: ADMIN; 1,2: STAFF
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

// Encrypt password before save
staffSchema.pre("save", async function(next) {
    if (!this.isModified("staffPassword")) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.staffPassword = await bcrypt.hash(this.staffPassword, salt);
    next();
});

// Check password is correct
staffSchema.methods.checkPassword = async function (staffPassword) {
    return await bcrypt.compare(staffPassword, this.staffPassword);
};

staffSchema.methods.updatePassword = async function (staffPassword) {
    this.staffPassword = staffPassword;
    await this.save();
};

// Get JSON Web Token
staffSchema.methods.getSignedTokenStaff = function (privilege) {
    return jwt.sign(
        { id: this._id, staff: true, privilege: privilege },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

const Staff = mongoose.model("Staff", staffSchema);
module.exports = Staff;

/**
 * @swagger
 * components:
 *   schemas:
 *     Staff:
 *       type: object
 *       required:
 *         - staffPassword
 *         - staffFirstName
 *         - staffLastName
 *         - staffEmail
 *         - staffPhone
 *         - privilege
 *       properties:
 *         staffPassword:
 *           type: string
 *         staffFirstName:
 *           type: string
 *         staffLastName:
 *           type: string
 *         staffEmail:
 *           type: string
 *         staffPhone:
 *           type: string
 *         staffGender:
 *           type: string
 *         staffStartWork:
 *           type: string
 *         staffStatus:
 *           type: number
 *         privilege:
 *           type: number
 */