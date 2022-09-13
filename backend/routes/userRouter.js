const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const auth = require("../middleware/auth");

// Register route
router.post("/register", async (req, res) => {
  try {

    const token = req.header("x-auth-token");
    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json("not logged in");

    if (!user.isAdmin) {res.status(401).json({msg: "Admin privileges required"}); return;}
      const { id, name, password, passwordCheck } = req.body;

      // validate
      // status code 400 means bad request
      // status code 500 means internal server error

      if (!id || !name || !password || !passwordCheck) {
        return res.status(400).json({ msg: "Not all fields have been entered" });
      }

      // Checking to ensure password length is at least 5 characters
      if (password.length < process.env.MIN_PASSWORD_LENGTH) {
        return res
          .status(400)
          .json({ msg: `The password needs to be at least ${process.env.MIN_PASSWORD_LENGTH} characters long` });
      }

      // Checking the password entered vs the password checker
      if (password !== passwordCheck) {
        return res
          .status(400)
          .json({ msg: "Passwords do not match. Please try again" });
      }

      // using Bcrypt to hash passwords for security
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash(password, salt);

      // creating out new user notice password value is passwordHash not password
      const newUser = new User({
        id: id,
        name: name,
        password: passwordHash,
      });
      const savedUser = await newUser.save();
      res.json(savedUser);
    // Catching any errors that come through
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

// login route setup
router.post("/login", async (req, res) => {
  try {
    const { id, password } = req.body;

    // validate

    if (!id || !password) {
      return res.status(400).json({ msg: "Not all fields have been entered" });
    }

    // checking id that was entered and comparing id in our database
    const user = await User.findOne({ id: id });
    if (!user) {
      return res
        .status(400)
        .json({ msg: "Invalid credentails" });
    }


    // Checking password entered and comparing with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // Creating our json web token by passing the user id and our JWT_SECRET
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        _id: user._id,
        id: user.id,
        name: user.name,
        APIkey: user.APIkey,
      },
    });
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

// delete user account route
router.delete("/delete", auth, async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json(false);

    if(!user.isAdmin) { return res.status(401).json({ msg: "You do not have permission to do this" }); }
    const deletedUser = await User.findByIdAndDelete(req.user);
    res.json(deletedUser);
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

// validating if user is logged in by boolean check most useful for front-end
router.post("/tokenIsValid", async (req, res) => {
  try {
    const token = req.header("x-auth-token");
    if (!token) return res.json(false);

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);

    const user = await User.findById(verified.id);
    if (!user) return res.json(false);

    return res.json(true);
  } catch (error) {
    res.status(500).json({ err: error.message });
  }
});

// This route is grabbing one user
router.get("/", auth, async (req, res) => {
  const user = await User.findById(req.user)
  res.json({
    firstName: user.name,
    id: user._id,
  })
});

module.exports = router;