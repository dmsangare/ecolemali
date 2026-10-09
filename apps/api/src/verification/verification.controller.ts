import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { VerificationService } from "./verification.service";
import { SignDocumentSchema, RevokeDocumentSchema } from "./dto";
import { ZodValidationPipe } from "../common/pipes";
import {
  RequirePermissions,
  CurrentUser,
  CurrentUserPayload,
} from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

@ApiTags("Verification")
@Controller("verify")
export class VerificationPublicController {
  constructor(private readonly service: VerificationService) {}

  @Get(":shortCode")
  @ApiOperation({ summary: "Verifier un document par short code (public)" })
  async verifyByShortCode(@Param("shortCode") shortCode: string) {
    return this.service.findPublicByShortCode(shortCode);
  }

  @Get(":shortCode/:token")
  @ApiOperation({ summary: "Verifier un document avec signature (public)" })
  async verifyWithToken(
    @Param("shortCode") shortCode: string,
    @Param("token") token: string,
  ) {
    return this.service.verify(shortCode, token);
  }
}

@ApiTags("Verification")
@ApiBearerAuth("access-token")
@Controller("verification")
@UseGuards(SchoolScopeGuard)
export class VerificationController {
  constructor(private readonly service: VerificationService) {}

  @Post("sign")
  @RequirePermissions("document:create")
  @ApiOperation({ summary: "Signer un document (retourne shortCode + token)" })
  async sign(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(SignDocumentSchema)) dto: any,
  ) {
    if (!user.schoolId) throw new BadRequestException("Ecole introuvable");
    return this.service.sign({
      schoolId: user.schoolId,
      type: dto.type,
      referenceId: dto.referenceId,
      meta: dto.meta,
      expiresAt: dto.expiresAt,
    });
  }

  @Post("revoke")
  @RequirePermissions("document:update")
  @ApiOperation({ summary: "Revoquer un document" })
  async revoke(
    @CurrentUser() user: CurrentUserPayload,
    @Body(new ZodValidationPipe(RevokeDocumentSchema)) dto: any,
  ) {
    return this.service.revoke(dto.shortCode, user.id);
  }
}
