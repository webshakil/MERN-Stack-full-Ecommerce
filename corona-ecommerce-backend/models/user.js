const mongoose = require('mongoose');
const crypto = require('crypto'); // to hash the password a core node js module.
const uuidv1 = require('uuid/v1'); // to generate unique strings.

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
      maxlength: 32,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      unique: true,
    },
    hashed_password: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      trim: true,
    },
    salt: String,
    role: {
      type: Number,
      default: 0,
    },
    history: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

// virtual field
userSchema
  .virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = uuidv1();
    this.hashed_password = this.encryptPassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  authenticate: function (plainText) {
    return this.encryptPassword(plainText) === this.hashed_password;
  },

  encryptPassword: function (password) {
    if (!password) return '';
    try {
      return crypto
        .createHmac('sha1', this.salt)
        .update(password)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },
};

module.exports = mongoose.model('User', userSchema);

//trim in mongoose use to remove the white spaces from the strings

//Password: We are not going to save the password but the hashed version of password. So, we are to use the virtual fields. We still get password from the user form the client side but we will not save the password but the hashed version of it.
//salt will be a long unique string. salt will be used later to generate hashed password.

//History: Later when user purchase items from our shop his purchase will be stored in the property history. So any time a user logs in he will be able to see his purchase history.

//Timestamp to created at and updated at

//we are saving user credential in the cookie
