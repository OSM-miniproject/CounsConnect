const admin = require("firebase-admin");
const User = require("../models/User");
const serviceAccount = require("../counsconnect-ec0c3-firebase-adminsdk-fbsvc-2a2f285b22.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  // Log the token for debugging
  console.log("Authorization header:", req.headers.authorization);

  if (!token) {
    return res.status(401).json({ msg: "No token, authorization denied" });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    // Attach uid from Firebase to req.user
    req.user = { uid: decoded.uid };

    // Skip MongoDB user check ONLY for /api/users/register
    if (req.path === "/register" && req.originalUrl.startsWith("/api/users")) {
      return next();
    }

    // Lookup user in MongoDB using Firebase UID
    const user = await User.findOne({ uid: decoded.uid });
    if (!user) {
      return res.status(401).json({ msg: "User not registered in database" });
    }

    // Add Mongo user details to req.user
    req.user = {
      id: user._id,
      uid: user.uid,
      role: user.role,
      email: user.email,
      name: user.name
    };

    next();
  } catch (err) {
    console.error("Token verification failed:", err);
    res.status(401).json({ msg: "Token is not valid" });
  }
};

module.exports = auth;
