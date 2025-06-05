const jwt = require("jsonwebtoken");
const User = require("../models/User");


const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            token = req.headers.authorization.split(" ")[1];
            const decoded = jwt.verify(token, process.env.SECRET_KEY);
            req.user = await User.findById(decoded.user.id).select("-password");
            if (!req.user) {
                return res.status(401).json({ message: "User not found" });
            }
            next();

        } catch (error) {
            console.error("Token verification error:", error);
            return res.status(401).json({ message: "Not authorized, token failed" });

        }
    }
    else {
        return res.status(401).json({ message: "Not authorized, no token porivded" });
    }

}

const admin = async (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ message: "Not authorized as an admin" });
    }
}

module.exports = { protect, admin };

