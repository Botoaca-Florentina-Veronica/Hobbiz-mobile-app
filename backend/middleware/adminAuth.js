const User = require("../models/User");

const adminAuth = async (req, res, next) => {
  try {
    const userId = req.userId; // Set by auth middleware

    if (!userId) {
      return res.status(401).json({ error: "Neautentificat." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "Utilizator negăsit." });
    }

    // Hardcoded admin ID check - ensure consistency with frontend AuthContext
    const ADMIN_ID = "6808bf9a48e492acb8db7173";
    const isHardcodedAdmin = String(user._id) === ADMIN_ID;

    if (!user.isAdmin && !isHardcodedAdmin) {
      return res
        .status(403)
        .json({ error: "Acces interzis. Necesită drepturi de administrator." });
    }

    next();
  } catch (error) {
    console.error("Eroare în adminAuth middleware:", error);
    res.status(500).json({ error: "Eroare server." });
  }
};

module.exports = adminAuth;
