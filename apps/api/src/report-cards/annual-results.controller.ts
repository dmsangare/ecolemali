import { Controller, Get, Post, Body, Query, HttpCode, HttpStatus, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { z } from "zod";
import { AnnualResultsService } from "./annual-results.service";
import { ZodValidationPipe } from "../common/pipes";
import { RequirePermissions, CurrentUser, CurrentUserPayload } from "../common/decorators";
import { SchoolScopeGuard } from "../common/guards";

const AnnualQuerySchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
  includeDraft: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});
type AnnualQuery = z.infer<typeof AnnualQuerySchema>;

const AnnualApplySchema = z.object({
  classId: z.string().uuid(),
  academicYearId: z.string().uuid(),
});
type AnnualApply = z.infer<typeof AnnualApplySchema>;

@ApiTags("ReportCards")
@ApiBearerAuth("access-token")
@Controller("annual-results")
@UseGuards(SchoolScopeGuard)
export class AnnualResultsController {
  constructor(private readonly service: AnnualResultsService) {}

  @Get()
  @RequirePermissions("report_card:view")
  @ApiOperation({ summary: "Resultats annuels d'une classe (moyenne annuelle, rang, decision de passage)" })
  compute(
    @Query(new ZodValidationPipe(AnnualQuerySchema)) q: AnnualQuery,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.compute(
      { classId: q.classId, academicYearId: q.academicYearId, includeDraft: !!q.includeDraft },
      user,
    );
  }

  @Post("apply")
  @HttpCode(HttpStatus.OK)
  @RequirePermissions("report_card:update")
  @ApiOperation({ summary: "Enregistrer le passage en classe superieure (eleves dont l'annee est complete)" })
  apply(
    @Body(new ZodValidationPipe(AnnualApplySchema)) dto: AnnualApply,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.service.apply(dto, user);
  }
}
