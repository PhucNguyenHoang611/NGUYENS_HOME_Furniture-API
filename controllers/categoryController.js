const mongoose = require("mongoose");
const Category = require("../models/category");
const Product = require("../models/product/product");
const ErrorResponse = require("../utils/errorResponse");

exports.getAllCategories = async (req, res, next) => {
    let options = {};

    if (req.query.search) {
        options = {
            ...options,
            $or: [
                {categoryName: new RegExp(req.query.search.toString(), "i")}
            ],
        }
    }

    let total = Category.countDocuments(options);
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || parseInt(await total);
    let last_page = Math.ceil(parseInt(await total)/limit);
    if (last_page < 1 && total > 0) {
        last_page = 1
    }

    try {
        const categories = await Category.find(options);
        res.status(200).json({
            success: true,
            message: "List of categories fetched successfully",
            data: categories,
            total: (await total).toString(),
            page: (await page).toString(),
            last_page: (await last_page).toString()
        });
    } catch (error) {
        next(error);
    }
};

exports.getCategoryById = async (req, res, next) => {
    const { categoryId } = req.params;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId))
        return next(new ErrorResponse("Please provide valid category's ID", 400));

    try {
        const category = await Category.findById(categoryId);

        if (!category)
            return next(new ErrorResponse("No category found", 404));
        
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        next(error);
    }
};

exports.createCategory = async (req, res, next) => {
    const { categoryName, categorySlug } = req.body;

    try {
        const slug = await Category.findOne({
            categorySlug: categorySlug
        });

        if (slug)
            return next(new ErrorResponse("Category slug existed in database", 400));
        else {
            const category = await Category.create({
                categoryName,
                categorySlug
            });
    
            res.status(201).json({
                success: true,
                message: "Category created successfully",
                data: category
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.updateCategory = async (req, res, next) => {
    const { categoryId } = req.params;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId))
        return next(new ErrorResponse("Please provide valid category's ID", 400));

    const { categoryName, categorySlug } = req.body;

    try {
        const slug = await Category.findOne({
            _id: { $ne: categoryId },
            categorySlug: categorySlug
        });

        if (slug) {
            return next(new ErrorResponse("Category slug existed in database", 400));
        }
        else {
            const category = await Category.findByIdAndUpdate(
                categoryId,
                { 
                    categoryName,
                    categorySlug 
                },
                { new: true }
            );
    
            if (!category)
                return next(new ErrorResponse("No category found", 404));
            
            res.status(200).json({
                success: true,
                message: "Category updated successfully",
                data: category
            });
        }
    } catch (error) {
        next(error);
    }
};

exports.deleteCategory = async (req, res, next) => {
    const { categoryId } = req.params;

    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId))
        return next(new ErrorResponse("Please provide valid category's ID", 400));

    try {
        const prodsList = await Product.find({
            productCategoryId: categoryId
        });

        if (prodsList.length > 0) {
            return next(new ErrorResponse("This category can't be deleted", 400));
        }
        else {
            const category = await Category.findByIdAndDelete(categoryId);

            if (!category)
                return next(new ErrorResponse("No category found", 404));
            
            res.status(200).json({
                success: true,
                message: "Category deleted successfully",
                data: category
            });
        }
    } catch (error) {
        next(error);
    }
};