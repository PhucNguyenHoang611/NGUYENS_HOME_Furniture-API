const mongoose = require("mongoose");
const Customer = require("../../models/customer");
const Cart = require("../../models/cart/cart");

const ErrorResponse = require("../../utils/errorResponse");
const base32 = require("base32");
const { sendEmail, sendEmailToResetPassword } = require("../../config/sendEmail");

exports.registerCustomer = async (req, res, next) => {
    const { customerPassword, customerFirstName, customerLastName, customerBirthday, customerEmail, customerGender } = req.body;

    try {
        const customer = await Customer.create({
            customerPassword,
            customerFirstName,
            customerLastName,
            customerBirthday,
            customerEmail,
            customerGender
        });

        sendOTPToCustomerEmail(customer, 201, res);
    } catch (error) {
        next(error);
    }
};

exports.loginGoogleAndFacebookCustomer = async (req, res, next) => {
    const { customerPassword, customerFirstName, customerLastName, customerBirthday, customerEmail, customerGender, customerProvider } = req.body;

    try {
        const customer = await Customer.findOne({
            customerEmail,
            customerProvider,
            isVerified: true,
            isActive: true
        });

        if (!customer) {
            const newCustomer = await Customer.create({
                customerPassword,
                customerFirstName,
                customerLastName,
                customerBirthday,
                customerEmail,
                customerGender,
                customerProvider,
                isVerified: true,
                customerStatus: true
            });

            sendTokenCustomerAndCreateCart(newCustomer, 201, res);
        } else {
            await customer.updateOne({
                customerStatus: true
            });
            await customer.save();

            sendTokenCustomer(customer, 201, res);
        }
    } catch (error) {
        next(error);
    }
};

exports.loginCustomer = async (req, res, next) => {
    const { customerEmail, customerPassword } = req.body;

    if (!customerEmail || !customerPassword)
        return next(ErrorResponse("Please provide email and password", 400));
    
    try {
        const customer = await Customer.findOne({
            customerEmail,
            isActive: true
        }).select("+customerPassword");
        
        if (!customer)
            return next(new ErrorResponse("Invalid credentials", 401));

        const passwordValid = await customer.checkPasswordCustomer(customerPassword);
		if (!passwordValid)
            return next(new ErrorResponse("Incorrect password", 401));

        await customer.updateOne({
            customerStatus: true
        });
        await customer.save();
        sendTokenCustomer(customer, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.logoutCustomer = async(req, res, next) => {
    const { customerId } = req.params;

    if (!customerId || !mongoose.Types.ObjectId.isValid(customerId))
        return next(new ErrorResponse("Please provide valid customer's ID", 400));

    try {
        const customer = await Customer.findById(customerId);

        if (!customer)
            return next(new ErrorResponse("No customer found", 404));

        await customer.updateOne({
            customerStatus: false
        });
        await customer.save();

        res.status(200).json({
            success: true,
            message: "Customer logged out"
        });
    } catch (error) {
        next(error);
    }
};

exports.verifyCustomerAfterSendOTP = async (req, res, next) => {
    const { customerIdToken, customerOTP } = req.body;

    const customerId = base32.decode(customerIdToken);

    try {
        const customer = await Customer.findById(customerId).select("+verificationKey");

        if (!customer)
            return next(new ErrorResponse("No customer found", 404));

        if (!(await customer.verifyOTPFromEmail(customerOTP)))
            return next(new ErrorResponse("Invalid OTP", 401));

        await customer.verifyCustomer();
        sendTokenCustomer(customer, 200, res);
    } catch (error) {
        next(error);
    }
};

exports.sendOTPToCustomer = async (req, res, next) => {
    const { customerEmail } = req.body;

    if (!customerEmail)
        return next(ErrorResponse("Please provide email", 400));

    try {
        const customer = await Customer.findOne({
            customerEmail,
            isVerified: false,
            isActive: true
        }).select("+verificationKey");
        
        if (!customer)
            return next(new ErrorResponse("Invalid credentials", 401));

        sendOTPToCustomerEmail(customer, 201, res);
    } catch (error) {
        next(error);
    }
};

exports.forgetPasswordCustomer = async (req, res, next) => {
    const { customerEmail } = req.body;

    try {
        const customer = await Customer.findOne({
            customerEmail
        }).select("+verificationKey");

        if (customer) 
            await sendOTPToResetPassword(customer, 200, res);
        else 
            next(new ErrorResponse("Invalid credentials", 401));
    } catch (error) {
        next(error);
    }
};

exports.resetPasswordCustomer = async (req, res, next) => {
    const { customerIdToken, customerOTP, customerPassword } = req.body;

    const customerId = base32.decode(customerIdToken);

    try {
        const customer = await Customer.findById(customerId).select("+verificationKey");

        if (!customer) return next(new ErrorResponse("No customer found", 404));

        if (!(await customer.verifyOTPFromEmail(customerOTP)))
            next(new ErrorResponse("Invalid OTP", 401));

        await customer.updatePasswordCustomer(customerPassword);

        res.status(201).json({
            success: true,
            message: "Reset password successfully",
        });
    } catch (error) {
        next(error);
    }
};

exports.changePasswordCustomer = async (req, res, next) => {
    const { customerIdToken, customerOldPassword, customerNewPassword } = req.body;

    const customerId = base32.decode(customerIdToken);

    try {
        const customer = await Customer.findById(customerId).select("+customerPassword");

        if (!customer) return next(new ErrorResponse("No customer found", 404));

        const passwordValid = await customer.checkPasswordCustomer(customerOldPassword);
        if (!passwordValid)
            return next(new ErrorResponse("Incorrect old password", 401));

        await customer.updatePasswordCustomer(customerNewPassword);

        res.status(201).json({
            success: true,
            message: "Change password successfully",
        });
    } catch (error) {
        next(error);
    }
};

const sendTokenCustomer = async (customer, statusCode, res) => {
	res.status(statusCode).json({
		success: true,
		token: customer.getSignedTokenCustomer(),
        customerIdToken: await customer.getBase32Id(),
        data: customer
	});
};

const sendTokenCustomerAndCreateCart = async (customer, statusCode, res) => {
    const signedToken = customer.getSignedTokenCustomer();
    const idToken = await customer.getBase32Id();

    await Cart.create({ customerId: customer._id });

	res.status(statusCode).json({
		success: true,
		token: signedToken,
        customerIdToken: idToken,
        data: customer
	});
};

// const sendOTPToCustomerEmail = async (customer, statusCode, res) => {
//     await sendEmail(
//         customer.customerEmail,
//         "Xác thực địa chỉ email của bạn",
//         `Xin chào ${customer.customerFirstName}, cảm ơn bạn vì đã lựa chọn thương hiệu của chúng tôi.\nVui lòng sử dụng mã OTP này để hoàn tất việc đăng ký: ${await customer.getOTPToSend()}.\nNGUYEN'S HOME Furniture`
//     );

//     res.status(statusCode).json({
//         success: true,
//         customerIdToken: await customer.getBase32Id()
//     });
// };

const sendOTPToCustomerEmail = async (customer, statusCode, res) => {
    await sendEmail(
        customer.customerEmail,
        "Xác thực địa chỉ email của bạn",
        customer.customerFirstName,
        await customer.getOTPToSend()
    );

    res.status(statusCode).json({
        success: true,
        customerIdToken: await customer.getBase32Id()
    });
};

const sendOTPToResetPassword = async (customer, statusCode, res) => {
    await sendEmailToResetPassword(
        customer.customerEmail,
        "Reset mật khẩu của bạn",
        customer.customerFirstName,
        await customer.getOTPToSend()
    );

    res.status(statusCode).json({
        success: true,
        customerIdToken: await customer.getBase32Id()
    });
};