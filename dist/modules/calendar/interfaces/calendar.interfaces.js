"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STATUS_COLORS = exports.ReminderStatus = exports.ReminderType = void 0;
var ReminderType;
(function (ReminderType) {
    ReminderType["EMAIL_24H"] = "EMAIL_24H";
    ReminderType["EMAIL_1H"] = "EMAIL_1H";
    ReminderType["SMS_24H"] = "SMS_24H";
    ReminderType["SMS_1H"] = "SMS_1H";
    ReminderType["PUSH"] = "PUSH";
})(ReminderType || (exports.ReminderType = ReminderType = {}));
var ReminderStatus;
(function (ReminderStatus) {
    ReminderStatus["PENDING"] = "PENDING";
    ReminderStatus["SENT"] = "SENT";
    ReminderStatus["FAILED"] = "FAILED";
    ReminderStatus["SKIPPED"] = "SKIPPED";
})(ReminderStatus || (exports.ReminderStatus = ReminderStatus = {}));
exports.STATUS_COLORS = {
    SCHEDULED: { bg: '#3788d8', border: '#2c6cb0', text: '#ffffff' },
    CONFIRMED: { bg: '#28a745', border: '#1e7e34', text: '#ffffff' },
    IN_PROGRESS: { bg: '#ffc107', border: '#d39e00', text: '#212529' },
    COMPLETED: { bg: '#6c757d', border: '#545b62', text: '#ffffff' },
    CANCELLED: { bg: '#dc3545', border: '#bd2130', text: '#ffffff' },
    NO_SHOW: { bg: '#17a2b8', border: '#117a8b', text: '#ffffff' },
};
//# sourceMappingURL=calendar.interfaces.js.map