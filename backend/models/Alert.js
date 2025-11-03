const mongoose = require('mongoose');
const AlertSchema = new mongoose.Schema({
    username: String,
    alert: String,
    timestamp: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Alert', AlertSchema);
