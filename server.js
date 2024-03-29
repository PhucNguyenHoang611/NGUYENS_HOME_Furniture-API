const express = require("express");
const connectDb = require("./config/db");
const swaggerJsDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger");
const errorHandler = require("./middleware/error");
const cookieSession = require("cookie-session");
const cors = require("cors");
const passport = require("passport");
const passportGoogleStrategy = require("./passport_google");
const passportFacebookStrategy = require("./passport_facebook");

const socket = require("socket.io");

const app = express();
connectDb();

app.use(
	cookieSession({
		name: "session",
		keys: ["nguyenshomefurniture"],
		maxAge: 24 * 60 * 60 * 100,
	})
);

app.use(cors());
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

app.use("/", (req, res, next) => {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

app.use("/api/auth/google/login/success", (req, res, next) => {
	res.header("Access-Control-Allow-Origin", process.env.CLIENT_ORIGIN_URL);
	res.header("Access-Control-Allow-Credentials", true);
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	next();
});

passport.serializeUser((user, done) => {
	done(null, user);
});

passport.deserializeUser((user, done) => {
	done(null, user);
});

const swaggerOptions = {
    swaggerDefinition: swaggerDocument,
    apis: ["server.js", "./routes/*.js", "./middleware/*.js", "./models/*.js", "./models/*/*.js"]
}

app.get("/", function (req, res) {
	res.redirect("/docs");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/staffs", require("./routes/staffs"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/addresses", require("./routes/addresses"));
app.use("/api/carts", require("./routes/carts"));
app.use("/api/feedbacks", require("./routes/feedbacks"));

app.use("/api/campaigns", require("./routes/campaigns"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/products", require("./routes/products"));
app.use("/api/imports", require("./routes/imports"));
app.use("/api/discounts", require("./routes/discounts"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/posts", require("./routes/blog_posts"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/subcategories", require("./routes/subcategories"));
app.use("/api/wishlist", require("./routes/wishlist"));
app.use("/api/attachments", require("./routes/attachments"));
app.use("/api/attachments", require("./routes/attachments"));
app.use("/api/colors", require("./routes/colors"));
app.use("/api/statistics", require("./routes/statistics"));

app.use("/api/conversations", require("./routes/conversations"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/vouchers", require("./routes/vouchers"));

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerJsDoc(swaggerOptions)));

// Authentication
/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearer:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

// Error Handler
app.use(errorHandler);

const server = app.listen(process.env.PORT || 5000, () => console.log("Up and running 🚀"));

// Socket.IO Configuration
const io = socket(server, {
	cors: {
		origin:
			(process.env.ENVIRONMENT === "Production")
			? ["https://nguyenshomefurniture.vercel.app", "https://nguyenshomefurniture-admin.vercel.app"]
			: ["http://localhost:5173", "http://localhost:5174"],
		credentials: true
	}
});

global.onlineUsers = new Map();

io.on("connection", (socket) => {

	socket.on("addUser", (userId) => {
		onlineUsers.set(userId, socket.id)
	});

	socket.on("sendMessage", (data) => {
		const receiverSocket = onlineUsers.get(data.receiverId);

		if (receiverSocket) {
			socket.to(receiverSocket).emit("receiveMessage", data.senderId, data.messageText);
		}
	});
});