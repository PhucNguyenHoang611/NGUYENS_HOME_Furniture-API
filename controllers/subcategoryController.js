const mongoose = require("mongoose");
const Subcategory = require("../models/subcategory");
const Product = require("../models/product/product");
const ErrorResponse = require("../utils/errorResponse");

exports.getAllSubcategories = async (req, res, next) => {
    let options = {};

    if (req.query.search) {
        options = {
            ...options,
            $or: [
                {subcategoryName: new RegExp(req.query.search.toString(), "i")}
            ],
        }
    }

    let total = Subcategory.countDocuments(options);
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || parseInt(await total);
    let last_page = Math.ceil(parseInt(await total)/limit);
    if (last_page < 1 && total > 0) {
        last_page = 1;
    }

    try {
        const subcategories = await Subcategory.find(options);
        res.status(200).json({
            success: true,
            message: "List of subcategories fetched successfully",
            data: subcategories,
            total: (await total).toString(),
            page: (await page).toString(),
            last_page: (await last_page).toString()
        });
    } catch (error) {
        next(error);
    }
};

exports.getSubcategoryById = async (req, res, next) => {
    const { subcategoryId } = req.params;

    if (!subcategoryId || !mongoose.Types.ObjectId.isValid(subcategoryId))
        return next(new ErrorResponse("Please provide valid subcategory's ID", 400));

    try {
        const subcategory = await Subcategory.findById(subcategoryId);

        if (!subcategory)
            return next(new ErrorResponse("No subcategory found", 404));
        
        res.status(200).json({
            success: true,
            data: subcategory
        });
    } catch (error) {
        next(error);
    }
};

exports.createSubcategory = async (req, res, next) => {
    const { subcategoryName, subcategorySlug } = req.body;

    try {
        const slug = await Subcategory.findOne({
            subcategorySlug: subcategorySlug
        });

        if (slug)
            return next(new ErrorResponse("Subcategory slug existed in database", 400));
        else {
            const subcategory = await Subcategory.create({
                subcategoryName,
                subcategorySlug
            });
    
            res.status(201).json({
                success: true,
                message: "Subcategory created successfully",
                data: subcategory
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.updateSubcategory = async (req, res, next) => {
    const { subcategoryId } = req.params;

    if (!subcategoryId || !mongoose.Types.ObjectId.isValid(subcategoryId))
        return next(new ErrorResponse("Please provide valid subcategory's ID", 400));

    const { subcategoryName, subcategorySlug } = req.body;

    try {
        const slug = await Subcategory.findOne({
            _id: { $ne: subcategoryId },
            subcategorySlug: subcategorySlug
        });

        if (slug) {
            return next(new ErrorResponse("Subcategory slug existed in database", 400));
        }
        else {
            const subcategory = await Subcategory.findByIdAndUpdate(
                subcategoryId,
                { subcategoryName, subcategorySlug },
                { new: true }
            );
    
            if (!subcategory)
                return next(new ErrorResponse("No subcategory found", 404));
            
            res.status(200).json({
                success: true,
                message: "Subcategory updated successfully",
                data: subcategory
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteSubcategory = async (req, res, next) => {
    const { subcategoryId } = req.params;

    if (!subcategoryId || !mongoose.Types.ObjectId.isValid(subcategoryId))
        return next(new ErrorResponse("Please provide valid subcategory's ID", 400));

    try {
        const prodsList = await Product.find({
            productSubcategoryId: subcategoryId
        });

        if (prodsList.length > 0) {
            return next(new ErrorResponse("This subcategory can't be deleted", 400));
        }
        else {
            const subcategory = await Subcategory.findByIdAndDelete(subcategoryId);

            if (!subcategory)
                return next(new ErrorResponse("No subcategory found", 404));
            
            res.status(200).json({
                success: true,
                message: "Subcategory deleted successfully",
                data: subcategory
            });
        }
    } catch (error) {
        next(error);
    }
};