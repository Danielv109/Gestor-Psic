"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecryptionFailureReason = exports.DecryptionError = exports.KeyPurpose = void 0;
var KeyPurpose;
(function (KeyPurpose) {
    KeyPurpose["CLINICAL_NOTES"] = "CLINICAL_NOTES";
    KeyPurpose["SHADOW_NOTES"] = "SHADOW_NOTES";
    KeyPurpose["USER_PERSONAL"] = "USER_PERSONAL";
})(KeyPurpose || (exports.KeyPurpose = KeyPurpose = {}));
class DecryptionError extends Error {
    constructor(message, keyId, resourceId, reason) {
        super(message);
        this.keyId = keyId;
        this.resourceId = resourceId;
        this.reason = reason;
        this.name = 'DecryptionError';
    }
}
exports.DecryptionError = DecryptionError;
var DecryptionFailureReason;
(function (DecryptionFailureReason) {
    DecryptionFailureReason["KEY_NOT_FOUND"] = "KEY_NOT_FOUND";
    DecryptionFailureReason["KEY_EXPIRED"] = "KEY_EXPIRED";
    DecryptionFailureReason["KEY_REVOKED"] = "KEY_REVOKED";
    DecryptionFailureReason["INVALID_CIPHERTEXT"] = "INVALID_CIPHERTEXT";
    DecryptionFailureReason["AUTH_TAG_MISMATCH"] = "AUTH_TAG_MISMATCH";
    DecryptionFailureReason["CORRUPTED_DATA"] = "CORRUPTED_DATA";
})(DecryptionFailureReason || (exports.DecryptionFailureReason = DecryptionFailureReason = {}));
//# sourceMappingURL=crypto.interfaces.js.map