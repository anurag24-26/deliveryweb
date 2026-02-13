const router = require("express").Router();
const passport = require("passport");

/**
 * STEP 1: Start Google login with role
 * Example:
 * /api/auth/google?role=USER
 * /api/auth/google?role=RESTAURANT
 */
router.get("/google", (req, res, next) => {
  const role = req.query.role || "USER";

  // store role temporarily in session
  req.session.loginRole = role;

  passport.authenticate("google", {
    scope: ["profile", "email"]
  })(req, res, next);
});

/**
 * STEP 2: Google callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
     if (req.user.role === "RESTAURANT") {
      res.redirect("https://deliveryweb-navy.vercel.app/restaurant/dashboard");
    } else {
      res.redirect("https://deliveryweb-navy.vercel.app/restaurants");
    }
  }
);

/**
 * STEP 3: Get logged-in user
 */
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  res.json(req.user);
});
/**
 * STEP 4: Logout (USER / RESTAURANT)
 */
router.post("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }

    // Destroy session completely
    req.session.destroy(() => {
      res.clearCookie("connect.sid"); // important for express-session
      res.json({ message: "Logged out successfully" });
    });
  });
});

module.exports = router;
