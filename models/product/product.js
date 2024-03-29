const mongoose = require("mongoose");
const Schema = mongoose.Schema;

var productSchema = new Schema(
    { 
        productName: {
            type: String,
            required: [true, "Please provide product's name."],
            trim: true
        },
        productDescription: {
            type: String,
            trim: true
        },
        productPrice: {
            type: Number,
            required: [true, "Please provide product's price."]
        },
        productCategoryId: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: [true, "Please provide product's category."]
        },
        productSubcategoryId: {
            type: Schema.Types.ObjectId,
            ref: "Subcategory",
            required: [true, "Please provide product's subcategory."]
        },
        productDiscountId: {
            type: Schema.Types.ObjectId,
            ref: "Discount",
            default: null
        },
        productQuantity: {
            type: Number,
            default: 0
        },
        productSold: {
            type: Number,
            default: 0
        },
        productStatus: {
            type: Boolean,
			default: true
        },
        productSupplierId: {
            type: Schema.Types.ObjectId,
            ref: "Supplier",
            default: null
        }
    },
    { timestamps: true }
);

productSchema.methods.updateProductSold = async function (productQuantity) {
    this.productSold += productQuantity;
    await this.save();
};

productSchema.methods.updateProductQuantity = async function (productQuantity) {
    this.productQuantity += productQuantity;
    await this.save();
};

productSchema.methods.reduceProductQuantity = async function (productQuantity) {
    this.productQuantity -= productQuantity;
    await this.save();
};

const Product = mongoose.model("Product", productSchema);
module.exports = Product;

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - productName
 *         - productPrice
 *         - productCategoryId
 *         - productSubcategoryId
 *       properties:
 *         productName:
 *           type: string
 *         productDescription:
 *           type: string
 *         productPrice:
 *           type: number
 *         productCategoryId:
 *           type: string
 *           description: Category ID
 *         productSubcategoryId:
 *           type: string
 *           description: Subcategory ID
 *         productDiscountId:
 *           type: string
 *           description: Discount ID
 *         productQuantity:
 *           type: number
 *         productSold:
 *           type: number
 *         productStatus:
 *           type: boolean
 *         productSupplierId:
 *           type: string
 *           description: Supplier ID
 */