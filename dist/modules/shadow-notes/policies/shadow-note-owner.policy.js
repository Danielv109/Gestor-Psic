"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShadowNoteOwnerPolicy = void 0;
const common_1 = require("@nestjs/common");
const shadow_notes_repository_1 = require("../shadow-notes.repository");
let ShadowNoteOwnerPolicy = class ShadowNoteOwnerPolicy {
    constructor(shadowNotesRepo) {
        this.shadowNotesRepo = shadowNotesRepo;
    }
    async handle(user, request) {
        const noteId = request.params?.id;
        if (!noteId) {
            return true;
        }
        const note = await this.shadowNotesRepo.findById(noteId);
        if (!note) {
            return false;
        }
        return note.therapistId === user.id;
    }
};
exports.ShadowNoteOwnerPolicy = ShadowNoteOwnerPolicy;
exports.ShadowNoteOwnerPolicy = ShadowNoteOwnerPolicy = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shadow_notes_repository_1.ShadowNotesRepository])
], ShadowNoteOwnerPolicy);
//# sourceMappingURL=shadow-note-owner.policy.js.map